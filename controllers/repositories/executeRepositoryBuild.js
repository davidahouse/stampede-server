const yaml = require("js-yaml");
const repositoryBuild = require("../../lib/repositoryBuild");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/executeRepositoryBuild";
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

  const buildInfo = await dependencies.cache.repositoryBuilds.fetchRepositoryBuild(
    owner,
    repository,
    buildID
  );

  if (buildInfo.branch === "$select") {
    res.writeHead(301, {
      Location:
        "/repositories/selectRepositoryBuildBranch?owner=" +
        owner +
        "&repository=" +
        repository +
        "&build=" +
        buildID,
    });
    res.end();
  } else {
    repositoryBuild.execute(
      owner,
      repository,
      buildID,
      buildInfo,
      dependencies
    );

    res.render(dependencies.viewsPath + "repositories/executeRepositoryBuild", {
      owners: owners,
      isAdmin: req.validAdminSession,
      owner: owner,
      repository: repository,
    });
  }
}

module.exports.path = path;
module.exports.handle = handle;
