const prettyMilliseconds = require("pretty-ms");

/**
 * handle activeBuilds
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
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

  res.render(path + "monitor/activeTasks", {
    tasks: tasks,
    prettyMilliseconds: ms => (ms != null ? prettyMilliseconds(ms) : "")
  });
}

module.exports.handle = handle;
