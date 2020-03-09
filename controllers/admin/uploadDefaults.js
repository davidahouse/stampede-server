const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/uploadDefaults";
}

/**
 * http method this handler will serve
 */
function method() {
  return "post";
}

/**
 * handle uploadDefaults
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  if (req.files != null) {
    const uploadDefaultsData = req.files.uploadFile;
    const uploadDefaults = yaml.safeLoad(uploadDefaultsData.data);
    if (uploadDefaults != null) {
      await dependencies.cache.storeSystemDefaults(uploadDefaults);
    }
  }

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
module.exports.method = method;
module.exports.handle = handle;
