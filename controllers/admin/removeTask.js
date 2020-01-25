const yaml = require("js-yaml");

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const taskID = req.body.taskID;
  await cache.removeTaskConfig(taskID);
  res.writeHead(301, {
    Location: "/admin/tasks"
  });
  res.end();
}

module.exports.handle = handle;
