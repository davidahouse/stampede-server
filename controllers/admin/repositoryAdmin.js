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
  let orgDefaultStatus = "No Defaults Found";
  if (
    orgDefaults != null &&
    orgDefaults.defaults != null &&
    Object.keys(orgDefaults.defaults).length > 0
  ) {
    orgDefaultStatus = "Has Defaults";
  }

  const repoDefaults = await dependencies.cache.repoConfigDefaults.fetchDefaults(
    owner,
    repository
  );
  let repoDefaultStatus = "No Defaults Found";
  if (
    repoDefaults != null &&
    repoDefaults.defaults != null &&
    Object.keys(repoDefaults.defaults).length > 0
  ) {
    repoDefaultStatus = "Has Defaults";
  }

  const orgOverrides = await dependencies.cache.orgConfigOverrides.fetchOverrides(
    owner
  );

  let orgOverrideStatus = "No Overrides Found";
  if (
    orgOverrides != null &&
    orgOverrides.overrides != null &&
    Object.keys(orgOverrides.overrides).length > 0
  ) {
    orgOverrideStatus = "Has Overrides";
  }

  const repoOverrides = await dependencies.cache.repoConfigOverrides.fetchOverrides(
    owner,
    repository
  );
  let repoOverrideStatus = "No Overrides Found";
  if (
    repoOverrides != null &&
    repoOverrides.overrides != null &&
    Object.keys(repoOverrides.overrides).length > 0
  ) {
    repoOverrideStatus = "Has Overrides";
  }

  const repositoryBuilds = await dependencies.cache.repositoryBuilds.fetchRepositoryBuilds(
    owner,
    repository
  );

  res.render(dependencies.viewsPath + "admin/repositoryAdmin", {
    owners: owners,
    isAdmin: req.validAdminSession,
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
    repositoryBuilds: repositoryBuilds.sort(),
    uploadError: req.query.uploadError,
  });
}

module.exports.path = path;
module.exports.handle = handle;
