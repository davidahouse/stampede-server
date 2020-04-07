/**
 * path this handler will serve
 */
function path() {
  return "/monitor/buildTaskDetails";
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
    const summary =
      taskDetails.details.result != null &&
      taskDetails.details.result.summary != null
        ? taskDetails.details.result.summary
        : "";
    const text =
      taskDetails.details.result != null &&
      taskDetails.details.result.text != null
        ? taskDetails.details.result.text
        : "";

    res.render(dependencies.viewsPath + "monitor/buildTaskDetails", {
      owners: owners,
      task: task,
      build: build,
      taskDetails: taskDetails,
      configValues: configValues,
      summary: summary,
      text: text,
    });
  } else {
    res.render(dependencies.viewsPath + "monitor/buildTaskDetails", {
      owners: owners,
      task: {},
      build: {},
      taskDetails: { details: {} },
      configValues: [],
      summary: "",
      text: "",
    });
  }
}

module.exports.path = path;
module.exports.handle = handle;
