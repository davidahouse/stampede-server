const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/uploadQueues";
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
async function handle(req, res, dependencies, owners) {
  if (req.files != null) {
    const uploadData = req.files.uploadFile;
    try {
      const uploadQueues = yaml.safeLoad(uploadData.data);
      if (uploadQueues != null) {
        await dependencies.cache.systemQueues.storeSystemQueues(uploadQueues);
      }
    } catch (e) {
      dependencies.logger.error("Error parsing queues file: " + e);
    }
  }

  const queueList = await dependencies.cache.systemQueues.fetchSystemQueues();
  res.render(dependencies.viewsPath + "admin/queues", {
    owners: owners,
    isAdmin: req.validAdminSession,
    queues: queueList != null ? queueList : [],
  });
}

module.exports.path = path;
module.exports.method = method;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
