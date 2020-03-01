const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/uploadRepositoryConfig";
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
    const repoConfig = yaml.safeLoad(uploadData.data);
    if (repoConfig != null) {
      await dependencies.cache.storeRepoConfig(owner, repository, repoConfig);
    }
  }

  res.writeHead(301, {
    Location:
      "/repositories/repositoryDetails?owner=" +
      owner +
      "&repository=" +
      repository
  });
  res.end();
}

module.exports.path = path;
module.exports.method = method;
module.exports.handle = handle;
