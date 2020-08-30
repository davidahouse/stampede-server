"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/admin/tasks";
}

/**
 * handle
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
      config: taskDetails,
    });
  }
  res.send(tasks);
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "admin-tasks",
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
