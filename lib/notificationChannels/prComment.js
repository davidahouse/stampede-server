"use strict";
const prettyMilliseconds = require("pretty-ms");

/**
 * sendNotification
 * @param {*} notification
 */
async function sendNotification(notification, dependencies) {
  let notificationPayload = null;

  if (!notification.payload.buildKey.startsWith("pullrequest")) {
    return null;
  }

  const matches = await matchesFilter(notification, dependencies);
  if (matches == false) {
    return;
  }

  const owner = notification.payload.owner;
  const repository = notification.payload.repo;
  const parts = notification.payload.buildKey.split("-");
  const prNumber = parts[1];

  if (notification.notification === "buildCompleted") {
    notificationPayload = await prepareBuildCompletedNotification(
      notification,
      dependencies
    );
  }

  if (notificationPayload != null) {
    await sendNotificationToPRComment(
      owner,
      repository,
      prNumber,
      notificationPayload,
      notification.channelConfig.config,
      dependencies
    );
  }
}

async function prepareBuildCompletedNotification(notification, dependencies) {
  // Ignore any builds that aren't PRs
  let moreInfoURL = dependencies.serverConfig.webURL;
  if (dependencies.serverConfig.prCommentNotificationMoreInfoURL != null) {
    moreInfoURL = dependencies.serverConfig.prCommentNotificationMoreInfoURL;
  }

  const build = await dependencies.db.fetchBuild(notification.build);
  const buildTasks = await dependencies.db.fetchBuildTasks(notification.build);
  const buildDetails = build.rows.length > 0 ? build.rows[0] : {};
  const duration = buildDetails.completed_at
    ? buildDetails.completed_at - buildDetails.started_at
    : null;
  const tasks = [];
  const artifacts = [];
  let artifactList = "";
  let failedTasks = false;
  for (let index = 0; index < buildTasks.rows.length; index++) {
    const taskDetails = await dependencies.cache.fetchTaskConfig(
      buildTasks.rows[index].task
    );
    const task = buildTasks.rows[index];
    task.title = taskDetails.title;
    task.duration =
      task.finished_at != null ? task.finished_at - task.started_at : null;
    if (task.conclusion == "failure") {
      failedTasks = true;
    }
    const detailsRows = await dependencies.db.fetchTaskDetails(task.task_id);
    const taskResultDetails = detailsRows.rows[0];

    if (
      taskResultDetails != null &&
      taskResultDetails.details != null &&
      taskResultDetails.details.result != null &&
      taskResultDetails.details.result.summary != null
    ) {
      task.summary = taskResultDetails.details.result.summary;
      task.summaryTable = taskResultDetails.details.result.summaryTable;
    }
    tasks.push(task);

    if (
      taskResultDetails != null &&
      taskResultDetails.details != null &&
      taskResultDetails.details.result != null &&
      taskResultDetails.details.result.artifacts != null
    ) {
      for (
        let aindex = 0;
        aindex < taskResultDetails.details.result.artifacts.length;
        aindex++
      ) {
        artifacts.push(taskResultDetails.details.result.artifacts[aindex]);
      }
    }
    const artifactRows = await dependencies.db.fetchTaskArtifacts(task.task_id);
    if (artifactRows != null && artifactRows.rows != null) {
      for (let aindex = 0; aindex < artifactRows.rows.length; aindex++) {
        artifacts.push(artifactRows.rows[aindex]);

        if (
          artifactRows.rows[aindex].type == "download" ||
          artifactRows.rows[aindex].type == "link"
        ) {
          artifactList +=
            "- [" +
            artifactRows.rows[aindex].title +
            "](" +
            artifactRows.rows[aindex].url +
            ")\n";
        } else if (artifactRows.rows[aindex].type == "installplist") {
          artifactList +=
            "- [" +
            artifactRows.rows[aindex].title +
            "](" +
            "itms-services://?action=download-manifest&url=" +
            encodeURIComponent(artifactRows.rows[aindex].url) +
            ")\n";
        }
      }
    }
  }

  let message = "";
  if (failedTasks == true) {
    if (notificationStyle(notification) === "summaryTable") {
      message = failedTasksMessageSummaryTable(notification, tasks);
    } else {
      message = failedTasksMessageSummary(notification, tasks);
    }
  } else {
    if (notificationStyle(notification) === "summaryTable") {
      message = successTasksMessageSummaryTable(notification, tasks);
    } else {
      message = successTasksMessageSummary(notification, tasks);
    }
    if (
      artifactList != "" &&
      dependencies.serverConfig.autoRenderArtifactListComment === "enabled"
    ) {
      message += "\n*Artifacts*:\n" + artifactList + "\n\n";
    }
  }

  message +=
    "\n[More Info...](" +
    moreInfoURL +
    "/repositories/buildDetails?buildID=" +
    notification.build +
    ")";
  return message;
}

async function sendNotificationToPRComment(
  owner,
  repository,
  prNumber,
  notification,
  config,
  dependencies
) {
  if (notification == null) {
    return;
  }

  await dependencies.scm.commentOnPR(
    owner,
    repository,
    prNumber,
    notification,
    dependencies.serverConfig
  );
}

async function matchesFilter(notification, dependencies) {
  if (notification.filter === "all") {
    return true;
  }

  const buildTasks = await dependencies.db.fetchBuildTasks(notification.build);
  let failedTasks = false;
  for (let index = 0; index < buildTasks.rows.length; index++) {
    const task = buildTasks.rows[index];
    if (task.conclusion == "failure") {
      failedTasks = true;
    }
  }

  if (notification.filter === "success" && failedTasks == false) {
    return true;
  } else if (notification.filter === "failure" && failedTasks == true) {
    return true;
  } else {
    return false;
  }
}

function notificationStyle(notification) {
  if (
    notification.channelConfig != null &&
    notification.channelConfig.config != null &&
    notification.channelConfig.config.style != null
  ) {
    return notification.channelConfig.config.style;
  } else {
    return "summary";
  }
}

function failedTasksMessageSummary(notification, tasks) {
  let message = ":scream: Oh no! Some of the stampede tasks have failed:\n\n";

  for (let index = 0; index < tasks.length; index++) {
    if (tasks[index].conclusion == "failure") {
      message += "- :x: " + tasks[index].title + "\n";
    } else {
      message += "- :white_check_mark: " + tasks[index].title + "\n";
    }
  }
  return message;
}

function failedTasksMessageSummaryTable(notification, tasks) {
  let message = ":scream: Oh no! Some of the stampede tasks have failed:\n\n";

  message += "| | |\n";
  message += "| --- | --- |\n";

  for (let index = 0; index < tasks.length; index++) {
    if (tasks[index].conclusion == "failure") {
      message += "| " + tasks[index].title + " | :x: Failure |\n";
    } else {
      message +=
        "| " + tasks[index].title + " | :white_check_mark: Success |\n";
    }
  }
  return message;
}

function successTasksMessageSummary(notification, tasks) {
  let message = ":racehorse: Sweet! All your stampede tasks have passed...\n\n";

  for (let index = 0; index < tasks.length; index++) {
    if (tasks[index].summary != null) {
      message += "*" + tasks[index].title + "*:\n";
      message += tasks[index].summary + "\n\n";
    }
  }
  return message;
}

function successTasksMessageSummaryTable(notification, tasks) {
  let message = ":racehorse: Sweet! All your stampede tasks have passed...\n\n";

  message += "| | |\n";
  message += "| --- | --- |\n";

  for (let index = 0; index < tasks.length; index++) {
    if (
      tasks[index].summaryTable != null &&
      tasks[index].summaryTable.length > 0
    ) {
      tasks[index].summaryTable.forEach((summary) => {
        message += "| ";
        if (summary.link != null) {
          message += '<a href="' + summary.link + '">';
          message += summary.title;
          message += "</a>";
        } else {
          message += summary.title;
        }
        message += " | ";
        if (summary.valueString != null) {
          message += summary.valueString;
          message += " ";
        }
        if (summary.valueBadges != null) {
          summary.valueBadges.forEach((badge) => {
            if (summary.link != null) {
              message += '<a href="' + summary.link + '">';
            }
            if (badge.logo != null && badge.style != null) {
              message +=
                '<img src="https://img.shields.io/badge/' +
                badge.shield +
                "?logo=" +
                badge.logo +
                "&style=" +
                badge.style +
                '" alt="' +
                badge.alt +
                '"/>';
            } else if (badge.logo != null) {
              message +=
                '<img src="https://img.shields.io/badge/' +
                badge.shield +
                "?logo=" +
                badge.logo +
                '" alt="' +
                badge.alt +
                '"/>';
            } else if (badge.style != null) {
              message +=
                '<img src="https://img.shields.io/badge/' +
                badge.shield +
                "?style=" +
                badge.style +
                '" alt="' +
                badge.alt +
                '"/>';
            } else {
              message +=
                '<img src="https://img.shields.io/badge/' +
                badge.shield +
                '" alt="' +
                badge.alt +
                '"/>';
            }
            if (summary.link != null) {
              message += "</a>";
            }
            message += " ";
          });
        }
        message += " | \n";
      });
    } else {
      message +=
        "| " + tasks[index].title + " | :white_check_mark: Success |\n";
    }
  }
  return message;
}

module.exports.sendNotification = sendNotification;
