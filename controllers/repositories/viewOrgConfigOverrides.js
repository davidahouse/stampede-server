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
  const orgOverrides = await cache.orgConfigOverrides.fetchOverrides(owner);
  const configOverrides = [];
  if (orgOverrides != null && orgOverrides.overrides != null) {
    Object.keys(orgOverrides.overrides).forEach(function(key) {
      configOverrides.push({
        key: key,
        value: orgOverrides.overrides[key]
      });
    });
  }
  res.render(path + "repositories/viewOrgConfigOverrides", {
    owner: owner,
    repository: repository,
    overrides: configOverrides
  });
}

module.exports.handle = handle;
