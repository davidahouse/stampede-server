const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/uploadRepositoryBuild";
}

/**
 * http method this handler will serve
 */
function method() {
  return "post";
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
  const owner = req.body.owner;
  const repository = req.body.repository;
  let repositoryAdminURL =
    "/admin/repositoryAdmin?owner=" + owner + "&repository=" + repository;

  if (req.files != null) {
    const uploadData = req.files.uploadFile;
    try {
      const buildInfo = yaml.safeLoad(uploadData.data);
      if (buildInfo != null) {
        await dependencies.cache.repositoryBuilds.updateRepositoryBuild(
          owner,
          repository,
          buildInfo
        );
      }
    } catch (e) {
      repositoryAdminURL += "&uploadError=Invalid build file";
    }
  }

  res.writeHead(301, {
    Location: repositoryAdminURL,
  });
  res.end();
}

module.exports.path = path;
module.exports.method = method;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
