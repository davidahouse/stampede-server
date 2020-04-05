const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/removeOwner";
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
  return "get";
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  await dependencies.cache.removeOwner(req.query.owner);
  res.writeHead(301, {
    Location: "/admin/owners",
  });
  res.end();
}

module.exports.path = path;
module.exports.method = method;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
