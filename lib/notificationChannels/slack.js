"use strict";
const prettyMilliseconds = require("pretty-ms");

const LynnRequest = require("lynn-request");

/**
 * sendNotification
 * @param {*} notification
 */
async function sendNotification(notification, dependencies) {
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
  const build = await dependencies.db.fetchBuild(notification.build);
  const buildTasks = await dependencies.db.fetchBuildTasks(notification.build);
  const buildDetails = build.rows.length > 0 ? build.rows[0] : {};
  const duration = buildDetails.completed_at
    ? buildDetails.completed_at - buildDetails.started_at
    : null;
  const tasks = [];
  const artifacts = [];
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
    tasks.push(task);
    const detailsRows = await dependencies.db.fetchTaskDetails(task.task_id);
    const taskResultDetails = detailsRows.rows[0];
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
      }
    }
  }

  let emoji = ":white_check_mark: *Build completed:* ";
  if (failedTasks == true) {
    emoji = ":x: *Build failed:* ";
  }

  let suffix = "";
  if (failedTasks == true) {
    suffix = " :point_left: @channel";
  }

  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            emoji +
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
            "|More info...>* " +
            suffix,
        },
      },
    ],
  };
}

async function sendNotificationToSlackAPI(notification, config, dependencies) {
  if (config == null || notification == null) {
    return;
  }

  return new Promise((resolve) => {
    const request = {};
    request.options = {};
    request.title = "sendMessage";
    request.options.protocol = "https:";
    request.options.port = 443;
    request.options.method = "POST";
    request.options.host = config.host;
    request.options.path = config.path;
    request.options.body = notification;
    const runner = new LynnRequest(request);
    runner.execute(function (result) {
      dependencies.logger.verbose("Slack notification sent!");
      resolve(result);
    });
  });
}

module.exports.sendNotification = sendNotification;
