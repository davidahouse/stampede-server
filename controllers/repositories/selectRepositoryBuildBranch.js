/**
 * path this handler will serve
 */
function path() {
  return "/repositories/selectRepositoryBuildBranch";
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
  const buildID = req.query.build;

  res.render(
    dependencies.viewsPath + "repositories/selectRepositoryBuildBranch",
    {
      owners: owners,
      owner: owner,
      repository: repository,
      build: buildID,
    }
  );
}

module.exports.path = path;
module.exports.handle = handle;
