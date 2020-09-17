"use strict";
const prettyMilliseconds = require("pretty-ms");

/**
 * sendNotification
 * @param {*} notification
 */
async function sendNotification(notification, dependencies) {
  console.log("sending pr comment notification:");
  console.dir(notification);
  let notificationPayload = null;

  if (!notification.payload.buildKey.startsWith("pullrequest")) {
    console.log("ignoring non PR for this notification");
    return null;
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

  if (failedTasks == true) {
    return "Oh no! You have failed tasks...";
  } else {
    return "Sweet! All your tasks have passed...";
  }
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

module.exports.sendNotification = sendNotification;
