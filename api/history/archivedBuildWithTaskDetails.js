"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/history/archivedBuildWithTaskDetails";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const build = await dependencies.db.archivedBuildWithTaskDetails();
  let found = {};
  if (build != null) {
    if (build.rows.length > 0) {
      found = build.rows[0];
      const buildTasks = await dependencies.db.fetchBuildTasks(found.build_id);
      const tasks = [];
      for (let index = 0; index < buildTasks.rows.length; index++) {
        const task = buildTasks.rows[index];
        const detailsRows = await dependencies.db.fetchTaskDetails(
          task.task_id
        );
        if (detailsRows.rows.length > 0) {
          task.details = detailsRows.rows[0].details;
        }
        const artifactRows = await dependencies.db.fetchTaskArtifacts(
          task.task_id
        );
        if (artifactRows != null && artifactRows.rows.length > 0) {
          if (task.artifacts == null) {
            task.artifacts = [];
          }
          for (let aindex = 0; aindex < artifactRows.rows.length; aindex++) {
            task.artifacts.push(artifactRows.rows[aindex]);
          }
        }
        tasks.push(task);
      }
      found.tasks = tasks;
    }
  }
  res.send(found);
}

module.exports.path = path;
module.exports.handle = handle;
