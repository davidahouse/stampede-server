/**
 * path this handler will serve
 */
function path() {
  return "/history/hourlySummary";
}

/**
 * handle dailySummary
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const buildSummary = await dependencies.db.summarizeHourlyBuilds();
  const buildLabels = [];
  const buildData = [];
  for (let index = 0; index < buildSummary.rows.length; index++) {
    buildLabels.push(buildSummary.rows[index].hour);
    buildData.push(buildSummary.rows[index].count);
  }

  const builds = {
    labels: buildLabels,
    datasets: [
      {
        label: "Builds",
        data: buildData,
        backgroundColor: "rgba(0, 255, 0, 0.6)",
      },
    ],
  };

  const taskSummary = await dependencies.db.summarizeHourlyTasks();

  const taskLabels = [];
  const taskData = [];
  for (let index = 0; index < taskSummary.rows.length; index++) {
    taskLabels.push(taskSummary.rows[index].hour);
    taskData.push(taskSummary.rows[index].count);
  }
  const tasks = {
    labels: taskLabels,
    datasets: [
      {
        label: "Tasks",
        data: taskData,
        backgroundColor: "rgba(0, 255, 0, 0.6)",
      },
    ],
  };

  res.render(dependencies.viewsPath + "history/hourlySummary", {
    owners: owners,
    isAdmin: req.validAdminSession,
    builds: builds,
    tasks: tasks,
  });
}

module.exports.path = path;
module.exports.handle = handle;
