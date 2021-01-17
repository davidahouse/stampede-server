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
 * if the route requires admin
 */
function requiresAdmin() {
  return true;
}

/**
 * handle uploadOverrides
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  if (req.files != null) {
    const uploadData = req.files.uploadFile;
    try {
      const uploadOverrides = yaml.safeLoad(uploadData.data);
      if (uploadOverrides != null) {
        await dependencies.cache.storeSystemOverrides(uploadOverrides);
      }
    } catch (e) {
      dependencies.logger.error("Error parsing overrides file: " + e);
    }
  }

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
module.exports.method = method;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
