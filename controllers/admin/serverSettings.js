require("pkginfo")(module);

/**
 * path this handler will serve
 */
function path() {
  return "/admin/serverSettings";
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
  const settings = [];
  Object.keys(dependencies.serverConfig).forEach(function (key) {
    if (key != "_" && key != "config" && key != "configs") {
      settings.push({ name: key, value: dependencies.serverConfig[key] });
    }
  });
  res.render(dependencies.viewsPath + "admin/serverSettings", {
    owners: owners,
    isAdmin: req.validAdminSession,
    settings: settings,
    version: module.exports.version,
  });
}

module.exports.path = path;
module.exports.handle = handle;
module.exports.requiresAdmin = requiresAdmin;
