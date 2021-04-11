/**
 * path this handler will serve
 */
function path() {
  return "/admin/viewRepoParseErrors";
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
  const errors = await dependencies.cache.fetchRepoParseErrors(
    owner,
    repository
  );
  console.dir(errors);

  res.render(dependencies.viewsPath + "admin/viewRepoParseErrors", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: owner,
    repository: repository,
    errors: errors,
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
