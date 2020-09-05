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

  const repositoryBuilds = await buildKeyList(
    owner,
    repository,
    currentRepositoryBuilds,
    dependencies
  );
  const sortedBuilds = repositoryBuilds.sort(function (a, b) {
    if (a.build < b.build) {
      return -1;
    } else if (a.build > b.build) {
      return 1;
    } else {
      return 0;
    }
  });

  // Get the branch list
  const branchBuildKeys = await dependencies.db.fetchBuildKeys(
    owner,
    repository,
    "branch-push"
  );
  const branchBuilds = await buildKeyList(
    owner,
    repository,
    uniqueBuildKeys(branchBuildKeys.rows),
    dependencies
  );

  // Get the release list
  const releaseKeys = await dependencies.db.fetchBuildKeys(
    owner,
    repository,
    "release"
  );
  const releases = await buildKeyList(
    owner,
    repository,
    uniqueBuildKeys(releaseKeys.rows),
    dependencies
  );

  // Get the pull request list
  const prBuildKeys = await dependencies.db.fetchBuildKeys(
    owner,
    repository,
    "pull-request"
  );
  console.dir(prBuildKeys.rows);
  const prBuilds = await buildKeyList(
    owner,
    repository,
    uniqueBuildKeys(prBuildKeys.rows),
    dependencies
  );
  console.dir(prBuilds);

  res.render(dependencies.viewsPath + "repositories/repositoryDetails", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: owner,
    repository: repository,
    activeBuilds: activeBuilds.rows,
    repositoryBuilds: sortedBuilds,
    branchBuilds: branchBuilds,
    releases: releases,
    prBuilds: prBuilds,
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

function uniqueBuildKeys(buildKeys) {
  console.log("buildKeys: ");
  console.dir(buildKeys);
  const uniqueKeys = [];
  if (buildKeys == null) {
    return uniqueKeys;
  }

  for (let index = 0; index < buildKeys.length; index++) {
    console.log(buildKeys[index]);
    if (!uniqueKeys.includes(buildKeys[index].build_key)) {
      uniqueKeys.push(buildKeys[index].build_key);
    } else {
      console.log("skipping: " + buildKeys[index].build_key);
    }
  }
  return uniqueKeys;
}

async function buildKeyList(owner, repository, buildKeys, dependencies) {
  const builds = [];
  console.log("buildKeyList:");
  console.dir(buildKeys);
  for (let index = 0; index < buildKeys.length; index++) {
    const recentBuild = await dependencies.db.mostRecentBuild(
      owner,
      repository,
      buildKeys[index]
    );

    if (recentBuild.rows.length > 0) {
      builds.push({
        buildKey: buildKeys[index],
        message: recentBuild.rows[0].started_at,
      });
    } else {
      builds.push({
        buildKey: buildKeys[index],
        message: "",
      });
    }
  }
  return builds;
}

module.exports.path = path;
module.exports.handle = handle;
