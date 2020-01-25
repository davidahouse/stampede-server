"use strict";

/**
 * handle activeTasks
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 * @param {*} cache
 * @param {*} db
 */
async function handle(req, res, serverConf, cache, db) {
  const activeTasks = await db.activeTasks();
  const tasks = [];
  for (let index = 0; index < activeTasks.rows.length; index++) {
    const taskDetails = await cache.fetchTaskConfig(
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

module.exports.handle = handle;
