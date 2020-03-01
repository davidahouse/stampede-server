"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/activeBuilds";
}

/**
 * handle activeBuilds
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const activeBuilds = await dependencies.cache.fetchActiveBuilds();
  let prefix = req.query.repository != null ? req.query.repository + "-" : "";
  if (req.query.owner != null) {
    prefix = req.query.owner + "-" + prefix;
  }
  console.log("Active build prefix: " + prefix);
  const filteredBuilds = activeBuilds.filter(build => build.startsWith(prefix));
  const builds = [];
  for (let index = 0; index < filteredBuilds.length; index++) {
    const buildID = filteredBuilds[index];
    const buildDetails = await dependencies.db.fetchBuild(buildID);
    const tasks = await dependencies.db.fetchBuildTasks(buildID);
    builds.push({
      buildID: buildID,
      buildDetails:
        buildDetails != null && buildDetails.rows.length > 0
          ? buildDetails.rows[0]
          : {},
      tasks: tasks.rows
    });
  }
  console.log("Active build count: " + builds.length);
  res.send(builds);
}

module.exports.path = path;
module.exports.handle = handle;
