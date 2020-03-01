/**
 * path this handler will serve
 */
function path() {
  return "/admin/overrides";
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const overrides = await dependencies.cache.fetchSystemOverrides();
  const configOverrides = [];
  if (overrides != null && overrides.overrides != null) {
    Object.keys(overrides.overrides).forEach(function(key) {
      configOverrides.push({
        key: key,
        value: overrides.overrides[key]
      });
    });
  }
  res.render(dependencies.viewsPath + "admin/overrides", {
    overrides: configOverrides
  });
}

module.exports.path = path;
module.exports.handle = handle;
