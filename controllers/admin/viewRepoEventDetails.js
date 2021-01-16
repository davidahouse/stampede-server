/**
 * path this handler will serve
 */
function path() {
  return "/admin/viewRepoEventDetails";
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
  let body = "";
  if (req.query.index >= 0 && req.query.index < events.length) {
    body = JSON.stringify(events[req.query.index].body, null, 2);
  }

  res.render(dependencies.viewsPath + "admin/viewRepoEventDetails", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: owner,
    repository: repository,
    body: body,
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
