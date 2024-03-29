"use strict";
const prettyMilliseconds = require("pretty-ms");
const axios = require('axios').default;

/**
 * sendNotification
 * @param {*} notification
 */
async function sendNotification(notification, dependencies) {
  const matches = await matchesFilter(notification, dependencies);
  if (matches == false) {
    return;
  }

  let notificationPayload = null;
  if (notification.notification === "buildStarted") {
    notificationPayload = await prepareBuildStartedNotification(
      notification,
      dependencies
    );
  } else if (notification.notification === "buildCompleted") {
    notificationPayload = await prepareBuildCompletedNotification(
      notification,
      dependencies
    );
  }

  if (notificationPayload != null) {
    await sendNotificationToSlackAPI(
      notificationPayload,
      notification.channelConfig.config,
      dependencies
    );
  }
}

async function prepareBuildStartedNotification(notification, dependencies) {
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            ":racehorse: *Build started:* " +
            notification.payload.owner +
            "/" +
            notification.payload.repo +
            " " +
            notification.payload.buildKey +
            " #" +
            notification.payload.buildNumber +
            " " +
            "*<" +
            dependencies.serverConfig.webURL +
            "/repositories/buildDetails?buildID=" +
            notification.build +
            "|More info...>*",
        },
      },
    ],
  };
}

async function prepareBuildCompletedNotification(notification, dependencies) {
  let moreInfoURL = dependencies.serverConfig.webURL;
  if (dependencies.serverConfig.slackNotificationMoreInfoURL != null) {
    moreInfoURL = dependencies.serverConfig.slackNotificationMoreInfoURL;
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
            "- *<" +
            artifactRows.rows[aindex].url +
            "|" +
            artifactRows.rows[aindex].title +
            ">*\n";
        } else if (artifactRows.rows[aindex].type == "installplist") {
          artifactList +=
            "- *<" +
            "itms-services://?action=download-manifest&url=" +
            encodeURIComponent(artifactRows.rows[aindex].url) +
            "|" +
            artifactRows.rows[aindex].title +
            ">*\n";
        }
      }
    }
  }

  let blocks = [];
  if (failedTasks == true) {
    blocks.push(...failedTasksMessageSummary(notification, tasks));
  } else {
    let summaryBlocks = successTasksMessageSummary(notification, tasks);
    blocks.push(...successTasksMessageSummary(notification, tasks));
  }

  if (
    artifactList != "" &&
    dependencies.serverConfig.autoRenderArtifactListComment === "enabled"
  ) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Artifacts*:\n" + artifactList,
      },
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        "*<" +
        moreInfoURL +
        "/repositories/buildDetails?buildID=" +
        notification.build +
        "|More info...>* ",
    },
  });

  return {
    blocks: blocks,
  };
}

async function sendNotificationToSlackAPI(notification, config, dependencies) {
  if (config == null || notification == null) {
    return;
  }

  const url = "https://" + config.host + "/" + config.path
  await axios({
    method: 'post',
    url: url,
    data: notification
  })
    .then(function (response) {
      dependencies.logger.verbose("http notification sent to " + url);
    })
    .catch(function (error) {
      dependencies.logger.error("Error sending notification: " + error)
    })
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

function failedTasksMessageSummary(notification, tasks) {
  let blocks = [];
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        "@channel :scream: Oh no! Some of the stampede tasks have failed for build " +
        notification.payload.owner +
        "/" +
        notification.payload.repo +
        " " +
        notification.payload.buildKey +
        " #" +
        notification.payload.buildNumber +
        ":\n\n",
    },
  });

  for (let index = 0; index < tasks.length; index++) {
    if (tasks[index].conclusion == "failure") {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":x: " + tasks[index].title,
        },
      });
    } else {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":white_check_mark: " + tasks[index].title,
        },
      });
    }
  }

  return blocks;
}

function successTasksMessageSummary(notification, tasks) {
  let blocks = [];
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        ":racehorse: *Build completed successfully!* " +
        notification.payload.owner +
        "/" +
        notification.payload.repo +
        " " +
        notification.payload.buildKey +
        " #" +
        notification.payload.buildNumber +
        ":\n\n",
    },
  });

  for (let index = 0; index < tasks.length; index++) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":white_check_mark: " + tasks[index].title,
      },
    });
  }

  return blocks;
}

module.exports.sendNotification = sendNotification;
