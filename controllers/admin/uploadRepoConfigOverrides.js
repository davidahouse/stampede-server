const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/uploadRepoConfigOverrides";
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
    const overrides = yaml.safeLoad(uploadData.data);
    if (overrides != null) {
      await dependencies.cache.repoConfigOverrides.storeOverrides(
        owner,
        repository,
        overrides
      );
    }
  }

  res.writeHead(301, {
    Location:
      "/admin/viewRepoConfigOverrides?owner=" +
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
