require("pkginfo")(module);

/**
 * path this handler will serve
 */
function path() {
  return "/help/tasks";
}

/**
 * if the route requires admin
 */
function requiresAdmin() {
  return false;
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const taskList = await dependencies.cache.fetchTasks();
  const sortedTasks = taskList.sort();
  const tasks = [];
  for (let index = 0; index < sortedTasks.length; index++) {
    const taskDetails = await dependencies.cache.fetchTaskConfig(
      sortedTasks[index]
    );
    if (taskDetails.adminTask == null || taskDetails.adminTask == false) {
      tasks.push({
        id: sortedTasks[index],
        title: taskDetails.title,
      });
    }
  }
  res.render(dependencies.viewsPath + "help/tasks", {
    owners: owners,
    isAdmin: req.validAdminSession,
    tasks: tasks,
  });
}

module.exports.path = path;
module.exports.handle = handle;
module.exports.requiresAdmin = requiresAdmin;
