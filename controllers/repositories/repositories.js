/**
 * path this handler will serve
 */
function path() {
  return "/repositories";
}

/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const repositories = await dependencies.db.fetchRepositoriesWithOwner(
    req.query.owner
  );
  res.render(dependencies.viewsPath + "repositories/repositories", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: req.query.owner,
    repositories: repositories.rows,
  });
}

module.exports.path = path;
module.exports.handle = handle;
