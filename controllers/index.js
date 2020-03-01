/**
 * path this handler will serve
 */
function path() {
  return "/";
}

/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  res.render(dependencies.viewsPath + "index", {});
}

module.exports.path = path;
module.exports.handle = handle;
