const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/removeRepoConfigOverrides";
}

/**
 * http method this handler will serve
 */
function method() {
  return "post";
}

/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const owner = req.body.owner;
  const repository = req.body.repository;
  await dependencies.cache.repoConfigOverrides.removeOverrides(
    owner,
    repository
  );
  res.writeHead(301, {
    Location:
      "/repositories/viewRepoConfigOverrides?owner=" +
      owner +
      "&repository=" +
      repository
  });
  res.end();
}

module.exports.path = path;
module.exports.method = method;
module.exports.handle = handle;
