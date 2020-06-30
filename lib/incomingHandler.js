"use strict";

// Event handlers
const checkSuiteEvent = require("../events/checkSuite");
const checkRunEvent = require("../events/checkRun");
const pullRequestEvent = require("../events/pullRequest");
const pushEvent = require("../events/push");
const releaseEvent = require("../events/release");

/**
 * handle task update
 * @param {*} job
 * @param {*} conf
 * @param {*} cache
 * @param {*} scm
 * @param {*} db
 */
async function handle(job, dependencies) {
  try {
    if (job.event === "check_suite") {
      await checkSuiteEvent.handle(
        job.body,
        dependencies.serverConfig,
        dependencies.cache,
        dependencies.scm,
        dependencies.db,
        dependencies.logger
      );
    } else if (job.event === "check_run") {
      await checkRunEvent.handle(
        job.body,
        dependencies.serverConfig,
        dependencies.cache,
        dependencies.scm,
        dependencies.db,
        dependencies.logger
      );
    } else if (job.event === "pull_request") {
      await pullRequestEvent.handle(
        job.body,
        dependencies.serverConfig,
        dependencies.cache,
        dependencies.scm,
        dependencies.db,
        dependencies.logger
      );
    } else if (job.event === "push") {
      await pushEvent.handle(
        job.body,
        dependencies.serverConfig,
        dependencies.cache,
        dependencies.scm,
        dependencies.db,
        dependencies.logger
      );
    } else if (job.event === "release") {
      await releaseEvent.handle(
        job.body,
        dependencies.serverConfig,
        dependencies.cache,
        dependencies.scm,
        dependencies.db,
        dependencies.logger
      );
    }
  } catch (e) {
    dependencies.logger.error("Error handling incoming message: " + e);
  }
}

module.exports.handle = handle;
