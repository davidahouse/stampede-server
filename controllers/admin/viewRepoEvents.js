/**
 * path this handler will serve
 */
function path() {
  return "/admin/viewRepoEvents";
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
  const events = await dependencies.cache.fetchRepoEvents(owner, repository);

  res.render(dependencies.viewsPath + "admin/viewRepoEvents", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: owner,
    repository: repository,
    events: events,
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
