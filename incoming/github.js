"use strict";
const eventLog = require("../lib/eventLog");

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

  if (dependencies.incomingQueue == null) {
    dependencies.logger.error("No incoming queue, unable to handle event");
    res.send({ status: "error adding to incoming queue" });
    return;
  }

  if (dependencies.serverConfig.logEventPath != null) {
    eventLog.save(
      {
        headers: req.headers,
        payload: req.body,
      },
      dependencies.serverConfig.logEventPath
    );
  }

  let response = {};
  if (req.headers["x-github-event"] === "check_suite") {
    dependencies.incomingQueue.add(
      {
        event: "check_suite",
        body: req.body,
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
  } else if (req.headers["x-github-event"] === "check_run") {
    dependencies.incomingQueue.add(
      {
        event: "check_run",
        body: req.body,
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
  } else if (req.headers["x-github-event"] === "pull_request") {
    dependencies.incomingQueue.add(
      {
        event: "pull_request",
        headers: req.headers,
        body: req.body,
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
  } else if (req.headers["x-github-event"] === "push") {
    dependencies.incomingQueue.add(
      {
        event: "push",
        headers: req.headers,
        body: req.body,
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
  } else if (req.headers["x-github-event"] === "release") {
    dependencies.incomingQueue.add(
      {
        event: "release",
        headers: req.headers,
        body: req.body,
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
  }
  res.send({ status: "received" });
}

module.exports.path = path;
module.exports.method = method;
module.exports.handle = handle;
