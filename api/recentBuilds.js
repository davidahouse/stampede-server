"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/recentBuilds";
}

/**
 * handle recentBuilds
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const recentBuilds = await dependencies.db.recentBuilds(
    "Last 7 Days",
    "All",
    req.query.owner + "/" + req.query.repository
  );

  const builds = [];
  if (recentBuilds != null) {
    for (let index = 0; index < recentBuilds.rows.length; index++) {
      const buildID = recentBuilds.rows[index].build_id;
      const buildDetails = await dependencies.db.fetchBuild(buildID);
      const tasks = await dependencies.db.fetchBuildTasks(buildID);
      builds.push({
        buildID: buildID,
        buildDetails:
          buildDetails != null && buildDetails.rows.length > 0
            ? buildDetails.rows[0]
            : {},
        tasks: tasks.rows,
      });
    }
  }
  res.send(builds);
}

module.exports.path = path;
module.exports.handle = handle;
