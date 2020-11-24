"use strict";

const taskQueue = require("../lib/taskQueue");
const prComment = require("../lib/notificationChannels/prComment");
const slack = require("../lib/notificationChannels/slack");

let notificationQueue = null;

/**
 * start
 * @param {*} dependencies
 */
function start(dependencies) {
  if (dependencies.serverConfig.handleNotificationChannelQueue === "enabled") {
    // Start our own queue that listens for updates that need to get
    // made back into GitHub
    notificationQueue = taskQueue.createTaskQueue("stampede-notification");
    notificationQueue.on("error", function (error) {
      // logger.error("Error from response queue: " + error);
    });

    notificationQueue.process(function (job) {
      try {
        // Based on the provider-id we will send to the correct handler
        if (job.data.providerID === "prcomment-notifications") {
          prComment.sendNotification(job.data, dependencies);
        } else if (job.data.providerID === "slack-notifications") {
          slack.sendNotification(job.data, dependencies);
        }
      } catch (e) {
        logger.error("Error handling pr comment notification: " + e);
      }
    });
  }
}

/**
 * shutdown
 */
async function shutdown() {
  if (notificationQueue != null) {
    await notificationQueue.close();
  }
}

module.exports.start = start;
module.exports.shutdown = shutdown;
