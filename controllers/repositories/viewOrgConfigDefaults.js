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
  const orgDefaults = await cache.orgConfigDefaults.fetchDefaults(owner);
  const configDefaults = [];
  if (orgDefaults != null && orgDefaults.defaults != null) {
    Object.keys(orgDefaults.defaults).forEach(function(key) {
      configDefaults.push({
        key: key,
        value: orgDefaults.defaults[key]
      });
    });
  }
  res.render(path + "repositories/viewOrgConfigDefaults", {
    owner: owner,
    repository: repository,
    defaults: configDefaults
  });
}

module.exports.handle = handle;
