const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/viewOrgConfigDefaults";
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
  const orgDefaults = await dependencies.cache.orgConfigDefaults.fetchDefaults(
    owner
  );
  const configDefaults = [];
  if (orgDefaults != null && orgDefaults.defaults != null) {
    Object.keys(orgDefaults.defaults).forEach(function (key) {
      configDefaults.push({
        key: key,
        value: orgDefaults.defaults[key],
      });
    });
  }
  res.render(dependencies.viewsPath + "repositories/viewOrgConfigDefaults", {
    owners: owners,
    owner: owner,
    repository: repository,
    defaults: configDefaults,
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
