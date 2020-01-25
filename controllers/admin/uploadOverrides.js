const yaml = require("js-yaml");

/**
 * handle uploadOverrides
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const uploadData = req.files.uploadFile;
  const uploadOverrides = yaml.safeLoad(uploadData.data);
  if (uploadOverrides != null) {
    await cache.storeSystemOverrides(uploadOverrides);
  }

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
