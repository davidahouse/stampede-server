"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/history/hourlySummary";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const buildSummary = await dependencies.db.summarizeHourlyBuilds();
  const builds = [];
  if (buildSummary != null) {
    for (let index = 0; index < buildSummary.rows.length; index++) {
      builds.push({
        hour: buildSummary.rows[index].hour,
        count: buildSummary.rows[index].count,
      });
    }
  }

  const taskSummary = await dependencies.db.summarizeHourlyTasks();
  const tasks = [];
  if (taskSummary != null) {
    for (let index = 0; index < taskSummary.rows.length; index++) {
      tasks.push({
        hour: taskSummary.rows[index].hour,
        count: taskSummary.rows[index].count,
      });
    }
  }
  res.send({ builds: builds, tasks: tasks });
}

module.exports.path = path;
module.exports.handle = handle;
