const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/removeRepositoryConfirm";
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
  res.render(dependencies.viewsPath + "admin/removeRepositoryConfirm", {
    owner: owner,
    repository: repository,
    owners: owners,
    isAdmin: req.validAdminSession,
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
