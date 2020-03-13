/**
 * path this handler will serve
 */
function path() {
  return "/repositories/toggleConfigSource";
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
  let owner = req.query.owner;
  let repository = req.query.repository;

  if (owner == null) {
    owner = req.body.owner;
    repository = req.body.repository;
    configSource = req.body.configSource;
  }

  await dependencies.cache.removeRepoConfig(owner, repository);
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
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
