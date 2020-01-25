/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const defaults = await cache.fetchSystemDefaults();
  const configDefaults = [];
  if (defaults != null && defaults.defaults != null) {
    Object.keys(defaults.defaults).forEach(function(key) {
      configDefaults.push({
        key: key,
        value: defaults.defaults[key]
      });
    });
  }
  res.render(path + "admin/defaults", { defaults: configDefaults });
}

module.exports.handle = handle;
