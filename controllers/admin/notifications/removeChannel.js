const yaml = require("js-yaml");
const { loggers } = require("winston");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/notifications/removeChannel";
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
  try {
    const channelID = req.body.channelID;
    await dependencies.cache.notifications.removeNotificationChannelConfig(
      channelID
    );
  } catch (e) {
    dependencies.logger.error("Error removing channel: " + e);
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
