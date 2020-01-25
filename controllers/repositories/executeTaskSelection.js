/**
 * handle executeTaskSelection
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const owner = req.query.owner;
  const repository = req.query.repository;

  const taskList = await cache.fetchTasks();
  const sortedTasks = taskList.sort();

  const buildTypeList = ["Pull Request", "Branch", "Release"];

  res.render(path + "repositories/executeTaskSelection", {
    owner: owner,
    repository: repository,
    taskList: sortedTasks,
    buildTypeList: buildTypeList
  });
}

module.exports.handle = handle;
