/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const overrides = await cache.fetchSystemOverrides();
  const configOverrides = [];
  if (overrides != null && overrides.overrides != null) {
    Object.keys(overrides.overrides).forEach(function(key) {
      configOverrides.push({
        key: key,
        value: overrides.overrides[key]
      });
    });
  }
  res.render(path + "admin/overrides", { overrides: configOverrides });
}

module.exports.handle = handle;
