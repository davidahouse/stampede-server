/**
 * path this handler will serve
 */
function path() {
  return "/admin/queues";
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
  const queueList = await dependencies.cache.systemQueues.fetchSystemQueues();
  res.render(dependencies.viewsPath + "admin/queues", {
    owners: owners,
    isAdmin: req.validAdminSession,
    queues: queueList != null ? queueList : [],
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
