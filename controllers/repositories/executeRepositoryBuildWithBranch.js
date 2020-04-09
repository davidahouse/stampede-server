const yaml = require("js-yaml");
const repositoryBuild = require("../../lib/repositoryBuild");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/executeRepositoryBuildWithBranch";
}

/**
 * method this handler will serve
 */
function method() {
  return "post";
}

/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const owner = req.body.owner;
  const repository = req.body.repository;
  const buildID = req.body.build;
  const branch = req.body.branch;
  console.dir(req.body);

  const buildInfo = await dependencies.cache.repositoryBuilds.fetchRepositoryBuild(
    owner,
    repository,
    buildID
  );

  console.dir(buildInfo);
  buildInfo.branch = branch;
  repositoryBuild.execute(owner, repository, buildID, buildInfo, dependencies);

  res.render(dependencies.viewsPath + "repositories/executeRepositoryBuild", {
    owners: owners,
    owner: owner,
    repository: repository,
  });
}

module.exports.path = path;
module.exports.method = method;
module.exports.handle = handle;
