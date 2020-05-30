const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/removeRepository";
}

/**
 * if the route requires admin
 */
function requiresAdmin() {
  return true;
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

  await dependencies.cache.removeRepoConfig(owner, repository);
  await dependencies.cache.repoConfigDefaults.removeDefaults(owner, repository);
  await dependencies.cache.repoConfigOverrides.removeOverrides(
    owner,
    repository
  );

  const repositoryBuilds = await dependencies.cache.repositoryBuilds.fetchRepositoryBuilds(
    owner,
    repository
  );
  if (repositoryBuilds != null) {
    for (let index = 0; index < repositoryBuilds.length; index++) {
      await dependencies.cache.repositoryBuilds.removeRepositoryBuild(
        owner,
        repository,
        repositoryBuilds[index]
      );
    }
  }

  await dependencies.db.removeRepositoryTaskDetails(owner, repository);
  await dependencies.db.removeRepositoryTasks(owner, repository);
  await dependencies.db.removeRepositoryBuilds(owner, repository);
  await dependencies.db.removeRepository(owner, repository);

  res.writeHead(301, {
    Location: "/admin/repositories",
  });
  res.end();
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
