const prettyMilliseconds = require("pretty-ms");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/repositoryBuildDetails";
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
  const build = req.query.build;

  const activeBuilds = await dependencies.db.activeBuilds(owner, repository);
  let foundActiveBuild = false;
  for (let bindex = 0; bindex < activeBuilds.rows.length; bindex++) {
    if (activeBuilds.rows[bindex].build_key === build) {
      foundActiveBuild = true;
    }
  }

  const buildDetails = await dependencies.cache.repositoryBuilds.fetchRepositoryBuild(
    owner,
    repository,
    build
  );
  let status = "idle";
  let message = "";
  if (buildDetails.schedule != null) {
    status = "scheduled";
    message =
      "⏰ Build is scheduled to run at " +
      buildDetails.schedule.hour.toString() +
      ":" +
      buildDetails.schedule.minute.toString() +
      " every day";
  }
  if (foundActiveBuild) {
    message = "🐎 Currently running";
    status = "active";
  }

  const recentBuilds = await dependencies.db.recentBuilds(
    "All",
    build,
    owner + "/" + repository,
    "All"
  );

  res.render(dependencies.viewsPath + "repositories/repositoryBuildDetails", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: owner,
    repository: repository,
    build: build,
    status: status,
    message: message,
    recentBuilds: recentBuilds.rows,
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

module.exports.path = path;
module.exports.handle = handle;
