const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/viewCachedConfig";
}

/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const owner = req.query.owner;
  const repository = req.query.repository;

  const repoConfig = await dependencies.cache.fetchRepoConfig(
    owner,
    repository
  );

  res.render(dependencies.viewsPath + "repositories/viewCachedConfig", {
    owner: owner,
    repository: repository,
    repoConfig: repoConfig != null ? yaml.safeDump(repoConfig) : null,
    configSource: req.query.configSource
  });
}

module.exports.path = path;
module.exports.handle = handle;
