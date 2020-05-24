"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/monitor/activeTasks";
}

/**
 * handle activeTasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const activeTasks = await dependencies.db.activeTasks();
  const tasks = [];
  for (let index = 0; index < activeTasks.rows.length; index++) {
    const taskDetails = await dependencies.cache.fetchTaskConfig(
      activeTasks.rows[index].task
    );
    const task = activeTasks.rows[index];
    task.title = taskDetails.title;
    task.duration =
      task.started_at != null
        ? new Date() - task.started_at
        : new Date() - task.queued_at;
    tasks.push(task);
  }
  res.send(tasks);
}

module.exports.path = path;
module.exports.handle = handle;
