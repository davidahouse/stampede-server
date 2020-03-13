require("pkginfo")(module);

/**
 * path this handler will serve
 */
function path() {
  return "/admin/login";
}

/**
 * if the route requires admin
 */
function requiresAdmin() {
  return false;
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  res.render(dependencies.viewsPath + "admin/login", {});
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
