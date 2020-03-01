/**
 * path this handler will serve
 */
function path() {
  return "/admin/defaults";
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const defaults = await dependencies.cache.fetchSystemDefaults();
  const configDefaults = [];
  if (defaults != null && defaults.defaults != null) {
    Object.keys(defaults.defaults).forEach(function(key) {
      configDefaults.push({
        key: key,
        value: defaults.defaults[key]
      });
    });
  }
  res.render(dependencies.viewsPath + "admin/defaults", {
    defaults: configDefaults
  });
}

module.exports.path = path;
module.exports.handle = handle;
