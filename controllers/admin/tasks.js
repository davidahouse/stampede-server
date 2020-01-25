/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const taskList = await cache.fetchTasks();
  const sortedTasks = taskList.sort();
  const tasks = [];
  for (let index = 0; index < sortedTasks.length; index++) {
    const taskDetails = await cache.fetchTaskConfig(sortedTasks[index]);
    tasks.push({
      id: sortedTasks[index],
      title: taskDetails.title
    });
  }
  res.render(path + "admin/tasks", { tasks: tasks });
}

module.exports.handle = handle;
