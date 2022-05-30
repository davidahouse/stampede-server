"use strict";

const taskQueue = require("../lib/taskQueue");

// Event handlers
const checkSuiteEvent = require("../scm/events/checkSuite");
const checkRunEvent = require("../scm/events/checkRun");
const pullRequestEvent = require("../scm/events/pullRequest");
const pushEvent = require("../scm/events/push");
const releaseEvent = require("../scm/events/release");
const { v4: uuidv4 } = require("uuid");

let incomingQueue = null;

/**
 * start
 * @param {*} dependencies
 */
function start(dependencies) {
  if (dependencies.serverConfig.handleIncomingQueue === "enabled") {
    incomingQueue = taskQueue.createTaskQueue(
      "stampede-" + dependencies.serverConfig.incomingQueue
    );
    incomingQueue.on("error", function (error) {
      // logger.error("Error from incoming queue: " + error);
    });

    incomingQueue.process(function (job) {
      return handle(job.data, dependencies);
    });
  }
  return incomingQueue;
}

/**
 * handle task update
 * @param {*} job
 * @param {*} dependencies
 */
async function handle(job, dependencies) {
  try {
    let eventID = uuidv4();
    if (job.headers != null) {
      Object.keys(job.headers).forEach(function (key) {
        if (key.toLowerCase() === "x-github-delivery") {
          eventID = job.headers[key];
        }
      });
    }

    if (job.event === "check_suite") {
      await checkSuiteEvent.handle(job.body, dependencies);
    } else if (job.event === "check_run") {
      await checkRunEvent.handle(job.body, dependencies);
    } else if (job.event === "pull_request") {
      await pullRequestEvent.handle(job.body, eventID, dependencies);
    } else if (job.event === "push") {
      await pushEvent.handle(job.body, eventID, dependencies);
    } else if (job.event === "release") {
      await releaseEvent.handle(job.body, eventID, dependencies);
    }
  } catch (e) {
    dependencies.logger.error("Error handling incoming message: " + e);
  }
}

/**
 * shutdown
 */
async function shutdown() {
  await incomingQueue.close();
}

module.exports.start = start;
module.exports.shutdown = shutdown;
