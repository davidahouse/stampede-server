async function handle(dependencies) {
  const pullRequestBuilds = await dependencies.db.buildsForRetention(
    "pull-request",
    15
  );
  deleteBuilds(pullRequestBuilds);
  const branchBuilds = await dependencies.db.buildsForRetention(
    "branch-push",
    15
  );
  const repositoryBuilds = await dependencies.db.buildsForRetention(
    "repository-build",
    15
  );
  const releaseBuilds = await dependencies.db.buildsForRetention(
    "release",
    3000
  );
}

async function deleteBuilds(builds, dependencies) {}

async function deleteBuild(build, dependencies) {}

module.exports.handle = handle;
