const prettyMilliseconds = require("pretty-ms");

/**
 * path this handler will serve
 */
function path() {
  return "/monitor/buildDetails";
}

/**
 * handle buildDetails
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const build = await dependencies.db.fetchBuild(req.query.buildID);
  const buildTasks = await dependencies.db.fetchBuildTasks(req.query.buildID);
  const buildDetails = build.rows.length > 0 ? build.rows[0] : {};
  const duration = buildDetails.completed_at
    ? buildDetails.completed_at - buildDetails.started_at
    : null;
  const tasks = [];
  const artifacts = [];
  for (let index = 0; index < buildTasks.rows.length; index++) {
    const taskDetails = await dependencies.cache.fetchTaskConfig(
      buildTasks.rows[index].task
    );
    const task = buildTasks.rows[index];
    task.title = taskDetails.title;
    task.duration =
      task.finished_at != null ? task.finished_at - task.started_at : null;
    tasks.push(task);
    const detailsRows = await dependencies.db.fetchTaskDetails(task.task_id);
    const taskResultDetails = detailsRows.rows[0];
    if (
      taskResultDetails != null &&
      taskResultDetails.details != null &&
      taskResultDetails.details.result != null &&
      taskResultDetails.details.result.artifacts != null
    ) {
      for (
        let aindex = 0;
        aindex < taskResultDetails.details.result.artifacts.length;
        aindex++
      ) {
        artifacts.push(taskResultDetails.details.result.artifacts[aindex]);
      }
    }
  }
  res.render(dependencies.viewsPath + "monitor/buildDetails", {
    owners: owners,
    isAdmin: req.validAdminSession,
    build: buildDetails,
    duration: duration,
    tasks: tasks,
    artifacts: artifacts,
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

module.exports.path = path;
module.exports.handle = handle;
