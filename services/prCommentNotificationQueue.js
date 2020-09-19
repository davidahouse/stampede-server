"use strict";

const taskQueue = require("../lib/taskQueue");
const prComment = require("../lib/notificationChannels/prComment");

let prCommentNotificationQueue = null;

/**
 * start
 * @param {*} dependencies
 */
function start(dependencies) {
  if (dependencies.serverConfig.handlePRCommentNotifications === "enabled") {
    // Start our own queue that listens for updates that need to get
    // made back into GitHub
    prCommentNotificationQueue = taskQueue.createTaskQueue(
      "stampede-prcomment-notifications"
    );
    prCommentNotificationQueue.on("error", function (error) {
      // logger.error("Error from response queue: " + error);
    });

    prCommentNotificationQueue.process(function (job) {
      try {
        prComment.sendNotification(job.data, dependencies);
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
  if (prCommentNotificationQueue != null) {
    await prCommentNotificationQueue.close();
  }
}

module.exports.start = start;
module.exports.shutdown = shutdown;
