const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/removeRepositoryBuild";
}

/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const owner = req.query.owner;
  const repository = req.query.repository;
  const buildID = req.query.build;

  await dependencies.cache.repositoryBuilds.removeRepositoryBuild(
    owner,
    repository,
    buildID
  );

  res.writeHead(301, {
    Location:
      "/repositories/repositoryDetails?owner=" +
      owner +
      "&repository=" +
      repository
  });
  res.end();
}

module.exports.path = path;
module.exports.handle = handle;
