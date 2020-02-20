const yaml = require("js-yaml");

/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const owner = req.query.owner;
  const repository = req.query.repository;
  const buildID = req.query.build;

  await cache.repositoryBuilds.removeRepositoryBuild(
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

module.exports.handle = handle;
