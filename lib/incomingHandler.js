"use strict";

// Event handlers
const checkSuiteEvent = require("../scm/events/checkSuite");
const checkRunEvent = require("../scm/events/checkRun");
const pullRequestEvent = require("../scm/events/pullRequest");
const pushEvent = require("../scm/events/push");
const releaseEvent = require("../scm/events/release");

/**
 * handle task update
 * @param {*} job
 * @param {*} dependencies
 */
async function handle(job, dependencies) {
  try {
    if (job.event === "check_suite") {
      await checkSuiteEvent.handle(job.body, dependencies);
    } else if (job.event === "check_run") {
      await checkRunEvent.handle(job.body, dependencies);
    } else if (job.event === "pull_request") {
      await pullRequestEvent.handle(job.body, dependencies);
    } else if (job.event === "push") {
      await pushEvent.handle(job.body, dependencies);
    } else if (job.event === "release") {
      await releaseEvent.handle(job.body, dependencies);
    }
  } catch (e) {
    dependencies.logger.error("Error handling incoming message: " + e);
  }
}

module.exports.handle = handle;
