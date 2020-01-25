const prettyMilliseconds = require('pretty-ms');

/**
 * handle buildDetails
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const build = await db.fetchBuild(req.query.buildID);
  const buildTasks = await db.fetchBuildTasks(req.query.buildID);
  const buildDetails = build.rows.length > 0 ? build.rows[0] : {};
  const duration = buildDetails.completed_at
    ? buildDetails.completed_at - buildDetails.started_at
    : null;
  const tasks = [];
  for (let index = 0; index < buildTasks.rows.length; index++) {
    const taskDetails = await cache.fetchTaskConfig(
      buildTasks.rows[index].task
    );
    const task = buildTasks.rows[index];
    task.title = taskDetails.title;
    task.duration =
      task.finished_at != null ? task.finished_at - task.started_at : null;
    tasks.push(task);
  }
  console.dir(tasks);
  res.render(path + 'repositories/buildDetails', {
    build: buildDetails,
    duration: duration,
    tasks: tasks,
    prettyMilliseconds: ms => (ms != null ? prettyMilliseconds(ms) : '')
  });
}

module.exports.handle = handle;
