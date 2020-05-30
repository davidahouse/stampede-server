/**
 * path this handler will serve
 */
function path() {
  return "/admin/addRepository";
}

/**
 * http method this handler will serve
 */
function method() {
  return "post";
}

/**
 * handle addRepository
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const owner = req.body.owner;
  const repository = req.body.repository;

  if (
    owner != null &&
    owner.length > 0 &&
    repository != null &&
    repository.length > 0
  ) {
    await dependencies.db.storeRepository(owner, repository);
  }
  res.writeHead(301, {
    Location: "/admin/repositories",
  });
  res.end();
}

module.exports.path = path;
module.exports.method = method;
module.exports.handle = handle;
