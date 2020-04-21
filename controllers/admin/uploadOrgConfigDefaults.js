const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/uploadOrgConfigDefaults";
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
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const owner = req.body.owner;
  const repository = req.body.repository;

  if (req.files != null) {
    const uploadData = req.files.uploadFile;
    try {
      const defaults = yaml.safeLoad(uploadData.data);
      if (defaults != null && defaults.defaults != null) {
        await dependencies.cache.orgConfigDefaults.storeDefaults(
          owner,
          defaults
        );
      }
    } catch (e) {}
  }

  res.writeHead(301, {
    Location:
      "/admin/viewOrgConfigDefaults?owner=" +
      owner +
      "&repository=" +
      repository,
  });
  res.end();
}

module.exports.path = path;
module.exports.method = method;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
