"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/history/tasks";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  let timeFilter = "Last 8 hours";
  if (req.query.time != null) {
    timeFilter = req.query.time;
  }

  let taskFilter = "All";
  if (req.query.task != null) {
    taskFilter = req.query.task;
  }

  let repositoryFilter = "All";
  if (req.query.repository != null) {
    repositoryFilter = req.query.repository;
  }

  let conclusionFilter = "All";
  if (req.query.conclusion != null) {
    conclusionFilter = req.query.conclusion;
  }

  let sorted = "Date DESC";
  if (req.query.sorted != null) {
    sorted = req.query.sorted;
  }

  let nodeFilter = "All";
  if (req.query.node != null) {
    nodeFilter = req.query.node;
  }

  const tasks = await dependencies.db.recentTasks(
    timeFilter,
    taskFilter,
    repositoryFilter,
    conclusionFilter,
    nodeFilter,
    sorted
  );
  res.send(tasks.rows);
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "history-tasks",
      parameters: [],
      responses: {
        200: {
          description: "",
        },
      },
    },
  };
}

module.exports.path = path;
module.exports.handle = handle;
module.exports.docs = docs;
