/**
 * path this handler will serve
 */
function path() {
  return "/admin/tasks";
}

/**
 * if the route requires admin
 */
function requiresAdmin() {
  return true;
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const taskList = await dependencies.cache.fetchTasks();
  const sortedTasks = taskList.sort();
  const tasks = [];
  for (let index = 0; index < sortedTasks.length; index++) {
    const taskDetails = await dependencies.cache.fetchTaskConfig(
      sortedTasks[index]
    );
    tasks.push({
      id: sortedTasks[index],
      title: taskDetails.title
    });
  }
  res.render(dependencies.viewsPath + "admin/tasks", { tasks: tasks });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
