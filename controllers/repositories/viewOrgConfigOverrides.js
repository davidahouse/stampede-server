const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/viewOrgConfigOverrides";
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
  const owner = req.query.owner;
  const repository = req.query.repository;
  const orgOverrides = await dependencies.cache.orgConfigOverrides.fetchOverrides(
    owner
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
  res.render(dependencies.viewsPath + "repositories/viewOrgConfigOverrides", {
    owner: owner,
    repository: repository,
    overrides: configOverrides
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
