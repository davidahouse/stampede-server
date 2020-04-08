/**
 * path this handler will serve
 */
function path() {
  return "/admin/enterNewRepository";
}

/**
 * handle executeTaskSelection
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  res.render(dependencies.viewsPath + "admin/enterNewRepository", {
    owners: owners,
  });
}

module.exports.path = path;
module.exports.handle = handle;
