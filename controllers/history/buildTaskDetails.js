/**
 * handle taskDetails
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const taskRows = await db.fetchTask(req.query.taskID);
  const task = taskRows.rows[0];
  const detailsRows = await db.fetchTaskDetails(req.query.taskID);
  const taskDetails = detailsRows.rows[0];
  const configValues = [];
  Object.keys(
    taskDetails.details.config != null ? taskDetails.details.config : {}
  ).forEach(function(key) {
    configValues.push({
      key: key,
      value: taskDetails.details.config[key].value,
      source: taskDetails.details.config[key].source
    });
  });
  const buildRows = await db.fetchBuild(task.build_id);
  const build = buildRows.rows[0];
  res.render(path + "history/buildTaskDetails", {
    task: task,
    build: build,
    taskDetails: taskDetails,
    configValues: configValues
  });
}

module.exports.handle = handle;
