const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/removeTask";
}

/**
 * if the route requires admin
 */
function requiresAdmin() {
  return true;
}

/**
 * http method this handler will serve
 */
function method() {
  return "post";
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const taskID = req.body.taskID;
  await dependencies.cache.removeTaskConfig(taskID);
  res.writeHead(301, {
    Location: "/admin/tasks",
  });
  res.end();
}

module.exports.path = path;
module.exports.method = method;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
