'use strict';

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 * @param {*} cache
 * @param {*} db
 */
async function handle(req, res, serverConf, cache, db) {
  const taskList = await cache.fetchTasks();
  const sortedTasks = taskList.sort();
  const tasks = [];
  for (let index = 0; index < sortedTasks.length; index++) {
    const taskDetails = await cache.fetchTaskConfig(sortedTasks[index]);
    tasks.push({
      id: sortedTasks[index],
      config: taskDetails
    });
  }
  res.send(tasks);
}

module.exports.handle = handle;
