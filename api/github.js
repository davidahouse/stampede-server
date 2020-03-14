"use strict";
const eventLog = require("../lib/eventLog");

// Event handlers
const checkSuiteEvent = require("../events/checkSuite");
const checkRunEvent = require("../events/checkRun");
const pullRequestEvent = require("../events/pullRequest");
const pushEvent = require("../events/push");
const releaseEvent = require("../events/release");

/**
 * The url path this handler will serve
 */
function path() {
  return "/github";
}

/**
 * The http method this handler will serve
 */
function method() {
  return "post";
}

/**
 * handle github hook
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  dependencies.logger.verbose("Github hook: " + req.headers["x-github-event"]);

  if (dependencies.serverConfig.logEventPath != null) {
    eventLog.save(
      {
        headers: req.headers,
        payload: req.body
      },
      dependencies.serverConfig.logEventPath
    );
  }

  let response = {};
  if (req.headers["x-github-event"] === "check_suite") {
    response = await checkSuiteEvent.handle(
      req,
      dependencies.serverConfig,
      dependencies.cache,
      dependencies.scm,
      dependencies.db,
      dependencies.logger
    );
  } else if (req.headers["x-github-event"] === "check_run") {
    response = await checkRunEvent.handle(
      req,
      dependencies.serverConfig,
      dependencies.cache,
      dependencies.scm,
      dependencies.db,
      dependencies.logger
    );
  } else if (req.headers["x-github-event"] === "pull_request") {
    response = await pullRequestEvent.handle(
      req,
      dependencies.serverConfig,
      dependencies.cache,
      dependencies.scm,
      dependencies.db,
      dependencies.logger
    );
  } else if (req.headers["x-github-event"] === "push") {
    response = await pushEvent.handle(
      req,
      dependencies.serverConfig,
      dependencies.cache,
      dependencies.scm,
      dependencies.db,
      dependencies.logger
    );
  } else if (req.headers["x-github-event"] === "release") {
    response = await releaseEvent.handle(
      req,
      dependencies.serverConfig,
      dependencies.cache,
      dependencies.scm,
      dependencies.db,
      dependencies.logger
    );
  }
  res.send(response);
}

module.exports.path = path;
module.exports.method = method;
module.exports.handle = handle;
