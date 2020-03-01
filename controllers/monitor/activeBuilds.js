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
async function handle(req, res, dependencies) {
  const builds = await dependencies.db.activeBuilds();
  res.render(dependencies.viewsPath + "monitor/activeBuilds", {
    builds: builds.rows,
    prettyMilliseconds: ms => (ms != null ? prettyMilliseconds(ms) : "")
  });
}

module.exports.path = path;
module.exports.handle = handle;
