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
    "Last 7 Days",
    "All",
    owner + "/" + repository
  );

  const currentRepositoryBuilds = await dependencies.cache.repositoryBuilds.fetchRepositoryBuilds(
    owner,
    repository
  );
  const activeBuilds = await dependencies.db.activeBuilds(owner, repository);

  const repositoryBuilds = [];
  // Add all the active builds first
  for (let bindex = 0; bindex < activeBuilds.rows.length; bindex++) {
    repositoryBuilds.push({
      build: activeBuilds.rows[bindex].build_key,
      status: "active",
      buildID: activeBuilds.rows[bindex].build_id,
    });
  }

  // Now check repository builds and don't add any that are active
  for (let index = 0; index < currentRepositoryBuilds.length; index++) {
    let foundActiveBuild = false;
    let buildID = null;
    for (let bindex = 0; bindex < activeBuilds.rows.length; bindex++) {
      if (
        activeBuilds.rows[bindex].build_key === currentRepositoryBuilds[index]
      ) {
        foundActiveBuild = true;
        buildID = activeBuilds.rows[bindex].build_id;
      }
    }

    const buildDetails = await dependencies.cache.repositoryBuilds.fetchRepositoryBuild(
      owner,
      repository,
      currentRepositoryBuilds[index]
    );

    if (!foundActiveBuild) {
      if (buildDetails.schedule != null) {
        repositoryBuilds.push({
          build: currentRepositoryBuilds[index],
          status: "scheduled",
          message:
            "⏰ Build is scheduled to run at " +
            buildDetails.schedule.hour.toString() +
            ":" +
            buildDetails.schedule.minute.toString() +
            " every day",
        });
      } else {
        repositoryBuilds.push({
          build: currentRepositoryBuilds[index],
          status: "idle",
        });
      }
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
    recentBuilds: recentBuilds.rows,
    repositoryBuilds: sortedBuilds,
  });
}

module.exports.path = path;
module.exports.handle = handle;
