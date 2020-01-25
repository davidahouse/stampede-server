const prettyMilliseconds = require("pretty-ms");

/**
 * handle activeBuilds
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const builds = await db.activeBuilds();
  res.render(path + "monitor/activeBuilds", {
    builds: builds.rows,
    prettyMilliseconds: ms => (ms != null ? prettyMilliseconds(ms) : "")
  });
}

module.exports.handle = handle;
