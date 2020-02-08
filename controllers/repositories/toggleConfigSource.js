/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  let owner = req.query.owner;
  let repository = req.query.repository;

  if (owner == null) {
    owner = req.body.owner;
    repository = req.body.repository;
    configSource = req.body.configSource;
  }

  await cache.removeRepoConfig(owner, repository);
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
