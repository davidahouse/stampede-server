"use strict";

const taskQueue = require("../lib/taskQueue");
const slack = require("../lib/notificationChannels/slack");

let slackNotificationQueue = null;

/**
 * start
 * @param {*} dependencies
 */
function start(dependencies) {
  if (dependencies.serverConfig.handleSlackNotifications === "enabled") {
    // Start our own queue that listens for updates that need to get
    // made back into GitHub
    slackNotificationQueue = taskQueue.createTaskQueue(
      "stampede-slack-notifications"
    );
    slackNotificationQueue.on("error", function (error) {
      // logger.error("Error from response queue: " + error);
    });

    slackNotificationQueue.process(function (job) {
      try {
        slack.sendNotification(job.data, dependencies);
      } catch (e) {
        logger.error("Error handling slack notification: " + e);
      }
    });
  }
}

/**
 * shutdown
 */
async function shutdown() {
  if (slackNotificationQueue != null) {
    await slackNotificationQueue.close();
  }
}

module.exports.start = start;
module.exports.shutdown = shutdown;
