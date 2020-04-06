const prettyMilliseconds = require("pretty-ms");
/**
 * path this handler will serve
 */
function path() {
  return "/admin/repositoryBuildDetails";
}

/**
 * handle repositoryBuildDetails
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const owner = req.query.owner;
  const repository = req.query.repository;
  const buildID = req.query.build;
  const build = await dependencies.cache.repositoryBuilds.fetchRepositoryBuild(
    owner,
    repository,
    buildID
  );

  res.render(dependencies.viewsPath + "admin/repositoryBuildDetails", {
    owners: owners,
    owner: owner,
    repository: repository,
    buildID: buildID,
    build: build != null ? build : {},
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

module.exports.path = path;
module.exports.handle = handle;
