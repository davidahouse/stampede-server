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

  const recentBuilds = await dependencies.db.recentBuilds(
    "Last 8 hours",
    "All",
    owner + "/" + repository
  );

  const currentRepositoryBuilds = await dependencies.cache.repositoryBuilds.fetchRepositoryBuilds(
    owner,
    repository
  );
  const activeBuilds = await dependencies.db.activeBuilds(owner, repository);
  const repositoryBuilds = [];
  for (let index = 0; index < currentRepositoryBuilds.length; index++) {
    let foundActiveBuild = false;
    for (let bindex = 0; bindex < activeBuilds.rows.length; bindex++) {
      if (
        activeBuilds.rows[bindex].build_key === currentRepositoryBuilds[index]
      ) {
        foundActiveBuild = true;
      }
    }

    if (foundActiveBuild) {
      repositoryBuilds.push({
        build: currentRepositoryBuilds[index],
        status: "active",
      });
    } else {
      repositoryBuilds.push({
        build: currentRepositoryBuilds[index],
        status: "idle",
      });
    }
  }
  res.render(dependencies.viewsPath + "repositories/repositoryDetails", {
    owners: owners,
    owner: owner,
    repository: repository,
    recentBuilds: recentBuilds.rows,
    repositoryBuilds: repositoryBuilds,
  });
}

module.exports.path = path;
module.exports.handle = handle;
