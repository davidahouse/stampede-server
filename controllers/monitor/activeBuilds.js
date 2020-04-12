const prettyMilliseconds = require("pretty-ms");

/**
 * path this handler will serve
 */
function path() {
  return "/monitor/activeBuilds";
}

/**
 * handle activeBuilds
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const builds = await dependencies.db.activeBuilds();
  res.render(dependencies.viewsPath + "monitor/activeBuilds", {
    owners: owners,
    isAdmin: req.validAdminSession,
    builds: builds.rows,
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

module.exports.path = path;
module.exports.handle = handle;
