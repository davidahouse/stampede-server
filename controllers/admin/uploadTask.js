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
  const uploadData = req.files.uploadFile;
  const taskConfig = yaml.safeLoad(uploadData.data);
  if (taskConfig != null) {
    if (taskConfig.id != null) {
      await cache.storeTask(taskConfig.id);
      await cache.storeTaskConfig(taskConfig.id, taskConfig);
    }
  }
  res.writeHead(301, {
    Location: "/admin/tasks"
  });
  res.end();
}

module.exports.handle = handle;
