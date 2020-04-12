const prettyMilliseconds = require("pretty-ms");

/**
 * path this handler will serve
 */
function path() {
  return "/monitor/activeTasks";
}

/**
 * handle activeBuilds
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
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
  const sortedTasks = tasks.sort(function (a, b) {
    if (a.node < b.node) {
      return -1;
    } else if (a.node > b.node) {
      return 1;
    } else {
      return 0;
    }
  });

  res.render(dependencies.viewsPath + "monitor/activeTasks", {
    owners: owners,
    isAdmin: req.validAdminSession,
    tasks: sortedTasks,
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

module.exports.path = path;
module.exports.handle = handle;
