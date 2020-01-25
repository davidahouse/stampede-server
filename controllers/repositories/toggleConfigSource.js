/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  let owner = req.query.owner;
  let repository = req.query.repository;
  let configSource = req.query.configSource;

  if (owner == null) {
    owner = req.body.owner;
    repository = req.body.repository;
    configSource = req.body.configSource;
  }

  if (configSource === "Repository .stampede.yaml") {
    res.render(path + "repositories/toggleConfigSource", {
      owner: owner,
      repository: repository
    });
  } else {
    await cache.removeRepoConfig(owner, repository);
    res.writeHead(301, {
      Location:
        "/repositories/repositoryDetails?owner=" +
        owner +
        "&repository=" +
        repository
    });
    res.end();
  }
}

module.exports.handle = handle;
