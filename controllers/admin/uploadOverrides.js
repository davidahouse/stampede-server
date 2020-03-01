const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/uploadOverrides";
}

/**
 * http method this handler will serve
 */
function method() {
  return "post";
}

/**
 * handle uploadOverrides
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  if (req.files != null) {
    const uploadData = req.files.uploadFile;
    const uploadOverrides = yaml.safeLoad(uploadData.data);
    if (uploadOverrides != null) {
      await dependencies.cache.storeSystemOverrides(uploadOverrides);
    }
  }

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
module.exports.method = method;
module.exports.handle = handle;
