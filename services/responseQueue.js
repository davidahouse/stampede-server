"use strict";

const taskQueue = require("../lib/taskQueue");
const taskUpdate = require("../lib/taskUpdate");
const taskArtifact = require("../lib/taskArtifact");
const notification = require("./notification");

let responseQueue = null;

/**
 * start
 * @param {*} dependencies
 */
function start(dependencies) {
  if (dependencies.serverConfig.handleResponseQueue === "enabled") {
    // Start our own queue that listens for updates that need to get
    // made back into GitHub
    responseQueue = taskQueue.createTaskQueue(
      "stampede-" + dependencies.serverConfig.responseQueue
    );
    responseQueue.on("error", function (error) {
      // logger.error("Error from response queue: " + error);
    });

    responseQueue.process(function (job) {
      if (job.data.response === "taskUpdate") {
        return taskUpdate.handle(
          job.data.payload,
          dependencies.serverConfig,
          dependencies.cache,
          dependencies.scm,
          dependencies.db,
          dependencies.logger
        );
      } else if (job.data.response === "taskArtifact") {
        return taskArtifact.handle(job.data.payload, dependencies);
      } else if (job.data.response === "heartbeat") {
        dependencies.cache.storeWorkerHeartbeat(job.data.payload);
        notification.workerHeartbeat(job.data.payload);
      }
    });
  }
}

/**
 * shutdown
 */
async function shutdown() {
  await responseQueue.close();
}

module.exports.start = start;
module.exports.shutdown = shutdown;
