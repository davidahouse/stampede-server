/**
 * path this handler will serve
 */
function path() {
  return "/admin/notifications/channelConfig";
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
  const channelConfig = await dependencies.cache.notifications.fetchNotificationChannelConfig(
    req.query.channelID
  );

  res.render(dependencies.viewsPath + "admin/notifications/channelConfig", {
    owners: owners,
    isAdmin: req.validAdminSession,
    channelID: req.query.channelID,
    title: channelConfig.title,
    config: channelConfig.config,
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
