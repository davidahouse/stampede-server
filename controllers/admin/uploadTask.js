const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/uploadTask";
}

/**
 * http method this handler will serve
 */
function method() {
  return "post";
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
  if (req.files != null) {
    const uploadData = req.files.uploadFile;
    try {
      const taskConfig = yaml.safeLoad(uploadData.data);
      if (taskConfig != null) {
        if (taskConfig.id != null) {
          await dependencies.cache.storeTask(taskConfig.id);
          await dependencies.cache.storeTaskConfig(taskConfig.id, taskConfig);
        }
      }
    } catch (e) {
      dependencies.logger.error("Error parsing task file: " + e);
    }
  }

  res.writeHead(301, {
    Location: "/admin/tasks",
  });
  res.end();
}

module.exports.path = path;
module.exports.method = method;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
