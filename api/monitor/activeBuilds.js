"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/monitor/activeBuilds";
}

/**
 * handle activeBuilds
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const builds = await dependencies.db.activeBuilds();
  const activeBuilds = [];
  for (let index = 0; index < builds.rows.length; index++) {
    const buildID = builds.rows[index].build_id;
    const buildDetails = await dependencies.db.fetchBuild(buildID);
    const tasks = await dependencies.db.fetchBuildTasks(buildID);
    activeBuilds.push({
      buildID: buildID,
      buildDetails:
        buildDetails != null && buildDetails.rows.length > 0
          ? buildDetails.rows[0]
          : {},
      tasks: tasks.rows,
    });
  }
  res.send(activeBuilds);
}

module.exports.path = path;
module.exports.handle = handle;
