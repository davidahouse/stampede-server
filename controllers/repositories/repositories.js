/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const repositories = await db.fetchRepositories();
  console.dir(repositories.rows);
  res.render(path + "repositories/repositories", {
    repositories: repositories.rows
  });
}

module.exports.handle = handle;
