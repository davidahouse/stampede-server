/**
 * path this handler will serve
 */
function path() {
  return "/history/buildTaskDetails";
}

/**
 * handle taskDetails
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const taskRows = await dependencies.db.fetchTask(req.query.taskID);
  const task = taskRows.rows[0];
  if (task != null) {
    const detailsRows = await dependencies.db.fetchTaskDetails(
      req.query.taskID
    );
    const taskDetails = detailsRows.rows[0];
    const configValues = [];
    if (req.validAdminSession == true) {
      Object.keys(
        taskDetails.details.config != null ? taskDetails.details.config : {}
      ).forEach(function (key) {
        configValues.push({
          key: key,
          value: taskDetails.details.config[key].value,
          source: taskDetails.details.config[key].source,
        });
      });
    }
    const buildRows = await dependencies.db.fetchBuild(task.build_id);
    const build = buildRows.rows[0];
    res.render(dependencies.viewsPath + "history/buildTaskDetails", {
      owners: owners,
      task: task,
      build: build,
      taskDetails: taskDetails,
      configValues: configValues,
    });
  } else {
    res.render(dependencies.viewsPath + "history/buildTaskDetails", {
      owners: owners,
      task: {},
      build: {},
      taskDetails: { details: {} },
      configValues: {},
    });
  }
}

module.exports.path = path;
module.exports.handle = handle;
