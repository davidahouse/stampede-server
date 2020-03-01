/**
 * path this handler will serve
 */
function path() {
  return "/repositories/executeTaskSelection";
}

/**
 * handle executeTaskSelection
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const owner = req.query.owner;
  const repository = req.query.repository;

  const taskList = await dependencies.cache.fetchTasks();
  const sortedTasks = taskList.sort();

  const buildTypeList = ["Pull Request", "Branch", "Release"];

  res.render(dependencies.viewsPath + "repositories/executeTaskSelection", {
    owner: owner,
    repository: repository,
    taskList: sortedTasks,
    buildTypeList: buildTypeList
  });
}

module.exports.path = path;
module.exports.handle = handle;
