"use strict";
const taskExecute = require("../lib/taskExecute");

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/executeTask";
}

/**
 * The http method this handler will serve
 */
function method() {
  return "post";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  // Expected body:
  // owner: ""
  // repository: "",
  // buildType: "Pull Request" | "Branch" | "Release",
  // task: the-task-id,
  // taskConfig:
  //    "key": "value",
  // scmConfig:
  //  pullRequest
  //    number
  //    title
  //    head
  //      ref
  //      sha
  //    base
  //      ref
  //      sha
  //  OR
  //  branch
  //    name
  //    sha
  //  OR
  //  release
  //    name
  //    tag
  //    sha
  // taskQueue: ""
  const taskDetails = await dependencies.cache.fetchTaskConfig(req.body.task);
  console.log("got task details for task: " + req.body.task);
  console.dir(taskDetails);
  if (taskDetails != null) {
    const executeConfig = req.body;
    executeConfig.task = taskDetails;

    taskExecute.handle(
      executeConfig,
      dependencies.serverConfig,
      dependencies.cache,
      dependencies.scm,
      dependencies.db
    );
    res.send({ status: "ok" });
  } else {
    res.send({ status: "task not found" });
  }
}

module.exports.path = path;
module.exports.method = method;
module.exports.handle = handle;
