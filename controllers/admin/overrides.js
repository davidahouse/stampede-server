/**
 * path this handler will serve
 */
function path() {
  return "/admin/overrides";
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
  const overrides = await dependencies.cache.fetchSystemOverrides();
  const configOverrides = [];
  if (overrides != null && overrides.overrides != null) {
    Object.keys(overrides.overrides).forEach(function (key) {
      configOverrides.push({
        key: key,
        value: overrides.overrides[key],
      });
    });
  }
  res.render(dependencies.viewsPath + "admin/overrides", {
    owners: owners,
    isAdmin: req.validAdminSession,
    overrides: configOverrides,
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
