/**
 * path this handler will serve
 */
function path() {
  return "/admin/repositoryAdmin";
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

  const buildNumber = await dependencies.cache.fetchBuildNumber(
    owner + "-" + repository + "-buildNumber"
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

  res.render(dependencies.viewsPath + "admin/repositoryAdmin", {
    owners: owners,
    owner: owner,
    repository: repository,
    nextBuildNumber: parseInt(buildNumber) + 1,
    configSource: configSource,
    configSourceDestination: configSourceDestination,
    configSourceAction: configSourceAction,
    orgDefaultStatus: orgDefaultStatus,
    repoDefaultStatus: repoDefaultStatus,
    orgOverrideStatus: orgOverrideStatus,
    repoOverrideStatus: repoOverrideStatus,
    repositoryBuilds: repositoryBuilds,
  });
}

module.exports.path = path;
module.exports.handle = handle;
