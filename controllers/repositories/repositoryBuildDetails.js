const prettyMilliseconds = require("pretty-ms");

/**
 * handle repositoryBuildDetails
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  res.render(path + "repositories/repositoryBuildDetails", {
    build: {
      owner: "davidahouse",
      repository: "stampede-server",
      id: "daily-build",
      scheduled_at: "10am"
    },
    prettyMilliseconds: ms => (ms != null ? prettyMilliseconds(ms) : "")
  });
}

module.exports.handle = handle;
