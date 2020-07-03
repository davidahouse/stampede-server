const prettyMilliseconds = require("pretty-ms");

/**
 * path this handler will serve
 */
function path() {
  return "/history/deleteBuild";
}

/**
 * handle buildDetails
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const buildID = req.query.buildID;
  await dependencies.db.removeBuild(buildID);
  res.writeHead(301, {
    Location: "/history/builds",
  });
  res.end();
}

module.exports.path = path;
module.exports.handle = handle;
