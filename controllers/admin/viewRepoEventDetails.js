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
  const eventID = req.query.eventID;
  const events = await dependencies.cache.fetchRepoEvents(owner, repository);
  let body = "";
  for (let index = 0; index < events.length; index++) {
    if (events[index].eventID === eventID) {
      body = JSON.stringify(events[index].body, null, 2);
    }
  }

  res.render(dependencies.viewsPath + "admin/viewRepoEventDetails", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: owner,
    repository: repository,
    eventID: eventID,
    body: body,
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
