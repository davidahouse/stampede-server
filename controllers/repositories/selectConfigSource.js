/**
 * path this handler will serve
 */
function path() {
  return "/repositories/selectConfigSource";
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
async function handle(req, res, dependencies) {
  let owner = req.query.owner;
  let repository = req.query.repository;

  res.render(dependencies.viewsPath + "repositories/selectConfigSource", {
    owner: owner,
    repository: repository
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
