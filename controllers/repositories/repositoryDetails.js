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
async function handle(req, res, dependencies) {
  const owner = req.query.owner;
  const repository = req.query.repository;

  const buildNumber = await dependencies.cache.fetchBuildNumber(
    owner + "-" + repository + "-buildNumber"
  );

  const activeBuilds = await dependencies.db.activeBuilds(owner, repository);
  const recentBuilds = await dependencies.db.recentBuilds(
    1000,
    50,
    owner,
    repository
  );

  // Cached Repo config
  const repoConfig = await dependencies.cache.fetchRepoConfig(
    owner,
    repository
  );
  const configSource =
    repoConfig != null ? "Cache" : "Repository .stampede.yaml";
  const configSourceDestination =
    repoConfig != null ? "viewCachedConfig" : "selectConfigSource";
  const configSourceAction = repoConfig != null ? "View" : "Upload";

  // Org and repo defaults and overrides
  const orgDefaults = await dependencies.cache.orgConfigDefaults.fetchDefaults(
    owner
  );
  const orgDefaultStatus =
    Object.keys(orgDefaults.defaults).length > 0
      ? "Has Defaults"
      : "No Defaults Found";

  const repoDefaults = await dependencies.cache.repoConfigDefaults.fetchDefaults(
    owner,
    repository
  );
  const repoDefaultStatus =
    Object.keys(repoDefaults.defaults).length > 0
      ? "Has Defaults"
      : "No Defaults Found";

  const orgOverrides = await dependencies.cache.orgConfigOverrides.fetchOverrides(
    owner
  );
  const orgOverrideStatus =
    Object.keys(orgOverrides.overrides).length > 0
      ? "Has Overrides"
      : "No Overrides Found";

  const repoOverrides = await dependencies.cache.repoConfigOverrides.fetchOverrides(
    owner,
    repository
  );
  const repoOverrideStatus =
    Object.keys(repoOverrides.overrides).length > 0
      ? "Has Overrides"
      : "No Overrides Found";

  const repositoryBuilds = await dependencies.cache.repositoryBuilds.fetchRepositoryBuilds(
    owner,
    repository
  );

  res.render(dependencies.viewsPath + "repositories/repositoryDetails", {
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
    repoOverrideStatus: repoOverrideStatus,
    repositoryBuilds: repositoryBuilds
  });
}

module.exports.path = path;
module.exports.handle = handle;
