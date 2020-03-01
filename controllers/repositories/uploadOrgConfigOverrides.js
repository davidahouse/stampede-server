const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/uploadOrgConfigOverrides";
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
    const overrides = yaml.safeLoad(uploadData.data);
    if (overrides != null) {
      await dependencies.cache.orgConfigOverrides.storeOverrides(
        owner,
        overrides
      );
    }
  }

  res.writeHead(301, {
    Location:
      "/repositories/viewOrgConfigOverrides?owner=" +
      owner +
      "&repository=" +
      repository
  });
  res.end();
}

module.exports.path = path;
module.exports.method = method;
module.exports.handle = handle;
