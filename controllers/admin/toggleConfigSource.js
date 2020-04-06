/**
 * path this handler will serve
 */
function path() {
  return "/admin/toggleConfigSource";
}

/**
 * if the route requires admin
 */
function requiresAdmin() {
  return true;
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
      "/admin/repositoryAdmin?owner=" + owner + "&repository=" + repository,
  });
  res.end();
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.method = method;
module.exports.handle = handle;
