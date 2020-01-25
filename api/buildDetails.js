'use strict'

/**
 * handle buildDetails
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 * @param {*} cache
 * @param {*} db
 */
async function handle(req, res, serverConf, cache, db) {
  const buildID = req.query.buildID
  const buildDetails = await db.fetchBuild(buildID)
  const tasks = await db.fetchBuildTasks(buildID)
  res.send({
    buildID: buildID,
    buildDetails: (buildDetails != null && buildDetails.rows.length > 0) ?
              buildDetails.rows[0] : {},
    tasks: tasks.rows,
  })
}

module.exports.handle = handle
