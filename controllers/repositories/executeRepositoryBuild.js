const yaml = require("js-yaml");
const repositoryBuild = require("../../lib/repositoryBuild");

/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, dependencies) {
  console.log("--- In executeRepositoryBuild!");
  const owner = req.query.owner;
  const repository = req.query.repository;
  const buildID = req.query.build;

  const buildInfo = await dependencies.cache.repositoryBuilds.fetchRepositoryBuild(
    owner,
    repository,
    buildID
  );
  console.dir(buildInfo);

  repositoryBuild.execute(owner, repository, buildID, buildInfo, dependencies);

  res.writeHead(301, {
    Location:
      "/repositories/repositoryBuildDetails?owner=" +
      owner +
      "&repository=" +
      repository +
      "&build=" +
      buildID
  });
  res.end();
}

module.exports.handle = handle;
