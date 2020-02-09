"use strict";
const taskExecute = require("../lib/taskExecute");

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 * @param {*} cache
 * @param {*} scm
 * @param {*} db
 */
async function handle(req, res, serverConf, cache, scm, db) {
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
  const taskDetails = await cache.fetchTaskConfig(req.body.task);
  console.log("got task details for task: " + req.body.task);
  console.dir(taskDetails);
  if (taskDetails != null) {
    const executeConfig = req.body;
    executeConfig.task = taskDetails;

    taskExecute.handle(executeConfig, serverConf, cache, scm, db);
    res.send({ status: "ok" });
  } else {
    res.send({ status: "task not found" });
  }
}

module.exports.handle = handle;
