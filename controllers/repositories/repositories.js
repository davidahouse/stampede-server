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
async function handle(req, res, dependencies) {
  const repositories = await dependencies.db.fetchRepositories();
  res.render(dependencies.viewsPath + "repositories/repositories", {
    repositories: repositories.rows
  });
}

module.exports.path = path;
module.exports.handle = handle;
