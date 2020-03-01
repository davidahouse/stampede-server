const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/viewRepoConfigOverrides";
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
  const orgOverrides = await dependencies.cache.repoConfigOverrides.fetchOverrides(
    owner,
    repository
  );
  const configOverrides = [];
  if (orgOverrides != null && orgOverrides.overrides != null) {
    Object.keys(orgOverrides.overrides).forEach(function(key) {
      configOverrides.push({
        key: key,
        value: orgOverrides.overrides[key]
      });
    });
  }
  res.render(dependencies.viewsPath + "repositories/viewRepoConfigOverrides", {
    owner: owner,
    repository: repository,
    overrides: configOverrides
  });
}

module.exports.path = path;
module.exports.handle = handle;
