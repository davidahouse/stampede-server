const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/viewCachedConfig";
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
async function handle(req, res, dependencies, owners) {
  const owner = req.query.owner;
  const repository = req.query.repository;

  const repoConfig = await dependencies.cache.fetchRepoConfig(
    owner,
    repository
  );

  res.render(dependencies.viewsPath + "admin/viewCachedConfig", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: owner,
    repository: repository,
    repoConfig: repoConfig != null ? yaml.safeDump(repoConfig) : null,
    configSource: req.query.configSource,
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
