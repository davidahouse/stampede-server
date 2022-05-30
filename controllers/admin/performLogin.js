require("pkginfo")(module);
const { v4: uuidv4 } = require("uuid");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/performLogin";
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
  return false;
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  if (req.body.password === dependencies.serverConfig.adminPassword) {
    const sessionID = uuidv4();
    await dependencies.cache.admin.storeSession(
      sessionID,
      { id: sessionID },
      1000 * 60 * 60 * 24 * 30
    );
    res.cookie("sSession", sessionID, { maxAge: 1000 * 60 * 60 * 24 * 30 });
    res.writeHead(302, { Location: "/" });
    res.end();
  } else {
    res.writeHead(301, { Location: "/admin/login" });
    res.end();
  }
}

module.exports.path = path;
module.exports.method = method;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
