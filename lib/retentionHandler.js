async function handle(dependencies) {
  try {
    const pullRequestBuilds = await dependencies.db.buildsForRetention(
      "pull-request",
      dependencies.serverConfig.defaultBuildRetentionDays
    );
    await archiveBuilds(pullRequestBuilds, dependencies);

    const branchBuilds = await dependencies.db.buildsForRetention(
      "branch-push",
      dependencies.serverConfig.defaultBuildRetentionDays
    );
    await archiveBuilds(branchBuilds, dependencies);

    const repositoryBuilds = await dependencies.db.buildsForRetention(
      "repository-build",
      dependencies.serverConfig.defaultBuildRetentionDays
    );
    await archiveBuilds(repositoryBuilds, dependencies);

    const releaseBuilds = await dependencies.db.buildsForRetention(
      "release",
      dependencies.serverConfig.defaultReleaseBuildRetentionDays
    );
    await archiveBuilds(releaseBuilds, dependencies);
  } catch (e) {
    dependencies.logger.error("Error in retentionHandler: " + e);
  }
}

async function archiveBuilds(builds, dependencies) {
  for (let index = 0; index < builds.rows.length; index++) {
    await archiveBuild(builds.rows[index], dependencies);
  }
}

async function archiveBuild(build, dependencies) {
  dependencies.logger.info("ARCHIVING BUILD: " + build.build_id);
  await dependencies.db.archiveBuild(build.build_id);
}

module.exports.handle = handle;
