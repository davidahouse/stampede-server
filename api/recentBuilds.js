"use strict";

/**
 * handle recentBuilds
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 * @param {*} cache
 * @param {*} db
 */
async function handle(req, res, serverConf, cache, db) {
  const recentBuilds = await db.recentBuilds(
    8,
    50,
    req.query.owner,
    req.query.repository
  );
  const builds = [];
  if (recentBuilds != null) {
    for (let index = 0; index < recentBuilds.rows.length; index++) {
      const buildID = recentBuilds.rows[index].build_id;
      const buildDetails = await db.fetchBuild(buildID);
      const tasks = await db.fetchBuildTasks(buildID);
      builds.push({
        buildID: buildID,
        buildDetails:
          buildDetails != null && buildDetails.rows.length > 0
            ? buildDetails.rows[0]
            : {},
        tasks: tasks.rows
      });
    }
  }
  res.send(builds);
}

module.exports.handle = handle;
