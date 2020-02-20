const prettyMilliseconds = require("pretty-ms");

/**
 * handle repositoryBuildDetails
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
  const build = await cache.repositoryBuilds.fetchRepositoryBuild(
    owner,
    repository,
    buildID
  );

  res.render(path + "repositories/repositoryBuildDetails", {
    owner: owner,
    repository: repository,
    buildID: buildID,
    build: build,
    prettyMilliseconds: ms => (ms != null ? prettyMilliseconds(ms) : "")
  });
}

module.exports.handle = handle;
