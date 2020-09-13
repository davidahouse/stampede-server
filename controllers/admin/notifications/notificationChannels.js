const { loggers } = require("winston");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/notifications/notificationChannels";
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
  const channelList = await dependencies.cache.notifications.fetchNotificationChannels();
  const sortedChannels = channelList.sort();
  const channels = [];
  for (let index = 0; index < sortedChannels.length; index++) {
    const channelConfig = await dependencies.cache.notifications.fetchNotificationChannelConfig(
      sortedChannels[index]
    );
    if (channelConfig != null) {
      channels.push({
        id: sortedChannels[index],
        title: channelConfig.title,
      });
    } else {
      dependencies.logger.error("Unable to locate channel config");
      channels.push({
        id: sortedChannels[index],
        title: "unknown",
      });
    }
  }
  res.render(
    dependencies.viewsPath + "admin/notifications/notificationChannels",
    {
      owners: owners,
      isAdmin: req.validAdminSession,
      channels: channels,
    }
  );
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
