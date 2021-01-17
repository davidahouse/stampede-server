const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/notifications/uploadChannel";
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
      const channelConfig = yaml.safeLoad(uploadData.data);
      if (channelConfig != null) {
        if (channelConfig.id != null) {
          await dependencies.cache.notifications.storeNotificationChannel(
            channelConfig.id
          );
          await dependencies.cache.notifications.storeNotificationChannelConfig(
            channelConfig.id,
            channelConfig
          );
        }
      }
    } catch (e) {
      dependencies.logger.error("Error parsing channels file: " + e);
    }
  }

  res.writeHead(301, {
    Location: "/admin/notifications/notificationChannels",
  });
  res.end();
}

module.exports.path = path;
module.exports.method = method;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
