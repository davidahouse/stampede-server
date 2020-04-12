/**
 * path this handler will serve
 */
function path() {
  return "/admin/defaults";
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
  const defaults = await dependencies.cache.fetchSystemDefaults();
  const configDefaults = [];
  if (defaults != null && defaults.defaults != null) {
    Object.keys(defaults.defaults).forEach(function (key) {
      configDefaults.push({
        key: key,
        value: defaults.defaults[key],
      });
    });
  }
  res.render(dependencies.viewsPath + "admin/defaults", {
    owners: owners,
    isAdmin: req.validAdminSession,
    defaults: configDefaults,
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
