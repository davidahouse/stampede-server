/**
 * path this handler will serve
 */
function path() {
  return "/repositories/selectConfigSource";
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
module.exports.handle = handle;
