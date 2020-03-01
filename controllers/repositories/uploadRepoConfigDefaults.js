const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/uploadRepoConfigDefaults";
}

/**
 * http method this handler will serve
 */
function method() {
  return "post";
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
    const defaults = yaml.safeLoad(uploadData.data);
    if (defaults != null) {
      await dependencies.cache.repoConfigDefaults.storeDefaults(
        owner,
        repository,
        defaults
      );
    }
  }

  res.writeHead(301, {
    Location:
      "/repositories/viewRepoConfigDefaults?owner=" +
      owner +
      "&repository=" +
      repository
  });
  res.end();
}

module.exports.path = path;
module.exports.method = method;
module.exports.handle = handle;
