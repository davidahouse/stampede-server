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
  const owner = req.query.owner;
  const repository = req.query.repository;

  const repoConfig = await cache.fetchRepoConfig(owner, repository);

  res.render(path + "repositories/viewCachedConfig", {
    owner: owner,
    repository: repository,
    repoConfig: yaml.safeDump(repoConfig),
    configSource: req.query.configSource
  });
}

module.exports.handle = handle;
