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

  const buildNumber = await cache.fetchBuildNumber(
    owner + "-" + repository + "-buildNumber"
  );

  const activeBuilds = await db.activeBuilds(owner, repository);
  const recentBuilds = await db.recentBuilds(1000, 50, owner, repository);

  // Cached Repo config
  const repoConfig = await cache.fetchRepoConfig(owner, repository);
  const configSource =
    repoConfig != null ? "Cache" : "Repository .stampede.yaml";
  const configSourceDestination =
    repoConfig != null ? "viewCachedConfig" : "toggleConfigSource";
  const configSourceAction = repoConfig != null ? "View" : "Upload";

  // Org and repo defaults and overrides
  const orgDefaults = await cache.orgConfigDefaults.fetchDefaults(owner);
  const orgDefaultStatus =
    Object.keys(orgDefaults.defaults).length > 0
      ? "Has Defaults"
      : "No Defaults Found";

  const repoDefaults = await cache.repoConfigDefaults.fetchDefaults(
    owner,
    repository
  );
  const repoDefaultStatus =
    Object.keys(repoDefaults.defaults).length > 0
      ? "Has Defaults"
      : "No Defaults Found";

  const orgOverrides = await cache.orgConfigOverrides.fetchOverrides(owner);
  const orgOverrideStatus =
    Object.keys(orgOverrides.overrides).length > 0
      ? "Has Overrides"
      : "No Overrides Found";

  const repoOverrides = await cache.repoConfigOverrides.fetchOverrides(
    owner,
    repository
  );
  const repoOverrideStatus =
    Object.keys(repoOverrides.overrides).length > 0
      ? "Has Overrides"
      : "No Overrides Found";

  res.render(path + "repositories/repositoryDetails", {
    owner: owner,
    repository: repository,
    nextBuildNumber: parseInt(buildNumber) + 1,
    activeBuilds: activeBuilds.rows,
    recentBuilds: recentBuilds.rows,
    configSource: configSource,
    configSourceDestination: configSourceDestination,
    configSourceAction: configSourceAction,
    orgDefaultStatus: orgDefaultStatus,
    repoDefaultStatus: repoDefaultStatus,
    orgOverrideStatus: orgOverrideStatus,
    repoOverrideStatus: repoOverrideStatus
  });
}

module.exports.handle = handle;
