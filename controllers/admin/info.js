require("pkginfo")(module);

/**
 * path this handler will serve
 */
function path() {
  return "/admin/info";
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
  res.render(dependencies.viewsPath + "admin/info", {
    version: module.exports.version
  });
}

module.exports.path = path;
module.exports.handle = handle;
module.exports.requiresAdmin = requiresAdmin;
