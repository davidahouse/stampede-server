const yaml = require("js-yaml");

/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const owner = req.body.owner;
  const repository = req.body.repository;
  const uploadData = req.files.uploadFile;
  const repoConfig = yaml.safeLoad(uploadData.data);
  if (repoConfig != null) {
    await cache.storeRepoConfig(owner, repository, repoConfig);
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

module.exports.handle = handle;
