require("pkginfo")(module);

/**
 * path this handler will serve
 */
function path() {
  return "/admin/logout";
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
async function handle(req, res, dependencies, owners) {
  res.clearCookie("sSession");
  res.writeHead(302, { Location: "/" });
  res.end();
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
