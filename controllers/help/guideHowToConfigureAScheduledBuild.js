require("pkginfo")(module);

/**
 * path this handler will serve
 */
function path() {
  return "/help/guideHowToConfigureAScheduledBuild";
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
  res.render(
    dependencies.viewsPath + "help/guideHowToConfigureAScheduledBuild",
    {
      owners: owners,
      isAdmin: req.validAdminSession,
    }
  );
}

module.exports.path = path;
module.exports.handle = handle;
module.exports.requiresAdmin = requiresAdmin;
