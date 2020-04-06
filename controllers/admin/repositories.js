/**
 * path this handler will serve
 */
function path() {
  return "/admin/repositories";
}

/**
 * if the route requires admin
 */
function requiresAdmin() {
  return true;
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const repositories = await dependencies.db.fetchRepositories();
  res.render(dependencies.viewsPath + "admin/repositories", {
    owners: owners,
    owner: req.query.owner,
    repositories: repositories.rows,
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
