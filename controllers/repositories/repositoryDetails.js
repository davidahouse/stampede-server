const prettyMilliseconds = require("pretty-ms");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/repositoryDetails";
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

  const currentRepositoryBuilds = await dependencies.cache.repositoryBuilds.fetchRepositoryBuilds(
    owner,
    repository
  );
  const activeBuilds = await dependencies.db.activeBuilds(owner, repository);

  const repositoryBuilds = [];

  // Now check repository builds and don't add any that are active
  for (let index = 0; index < currentRepositoryBuilds.length; index++) {
    const recentBuild = await dependencies.db.mostRecentBuild(
      owner,
      repository,
      currentRepositoryBuilds[index]
    );

    if (recentBuild.rows.length > 0) {
      repositoryBuilds.push({
        build: currentRepositoryBuilds[index],
        message: recentBuild.rows[0].started_at,
      });
    } else {
      repositoryBuilds.push({
        build: currentRepositoryBuilds[index],
        message: "",
      });
    }
  }

  const sortedBuilds = repositoryBuilds.sort(function (a, b) {
    if (a.build < b.build) {
      return -1;
    } else if (a.build > b.build) {
      return 1;
    } else {
      return 0;
    }
  });

  res.render(dependencies.viewsPath + "repositories/repositoryDetails", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: owner,
    repository: repository,
    activeBuilds: activeBuilds.rows,
    repositoryBuilds: sortedBuilds,
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

module.exports.path = path;
module.exports.handle = handle;
