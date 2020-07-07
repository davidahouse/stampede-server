const prettyMilliseconds = require("pretty-ms");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/repositorySourceDetails";
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
  const build_key = req.query.build_key;

  const recentBuilds = await dependencies.db.recentBuilds(
    "All",
    build_key,
    owner + "/" + repository
  );

  res.render(dependencies.viewsPath + "repositories/repositorySourceDetails", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: owner,
    repository: repository,
    build_key: build_key,
    recentBuilds: recentBuilds.rows,
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

module.exports.path = path;
module.exports.handle = handle;
