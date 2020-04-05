/**
 * path this handler will serve
 */
function path() {
  return "/history/dailySummary";
}

/**
 * handle dailySummary
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  let todayBuildsCount = "";
  const todayBuilds = await dependencies.db.countRecentBuilds("Today");
  if (todayBuilds.rows.length > 0) {
    todayBuildsCount = todayBuilds.rows[0].count;
  }

  let yesterdayBuildsCount = "";
  const yesterdayBuilds = await dependencies.db.countRecentBuilds("Yesterday");
  if (yesterdayBuilds.rows.length > 0) {
    yesterdayBuildsCount = yesterdayBuilds.rows[0].count;
  }

  let todayTasksCount = "";
  const todayTasks = await dependencies.db.countRecentTasks("Today");
  if (todayTasks.rows.length > 0) {
    todayTasksCount = todayTasks.rows[0].count;
  }

  let yesterdayTasksCount = "";
  const yesterdayTasks = await dependencies.db.countRecentTasks("Yesterday");
  if (yesterdayTasks.rows.length > 0) {
    yesterdayTasksCount = yesterdayTasks.rows[0].count;
  }

  const buildSummary = await dependencies.db.summarizeRecentBuilds();
  const buildLabels = [];
  const buildData = [];
  for (let index = 0; index < buildSummary.rows.length; index++) {
    buildLabels.push(buildSummary.rows[index].date);
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

  const taskSummary = await dependencies.db.summarizeRecentTasks();

  const taskLabels = [];
  const taskData = [];
  for (let index = 0; index < taskSummary.rows.length; index++) {
    taskLabels.push(taskSummary.rows[index].date);
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

  res.render(dependencies.viewsPath + "history/dailySummary", {
    owners: owners,
    yesterdayBuilds: yesterdayBuildsCount,
    yesterdayTasks: yesterdayTasksCount,
    todayBuilds: todayBuildsCount,
    todayTasks: todayTasksCount,
    builds: builds,
    tasks: tasks,
  });
}

module.exports.path = path;
module.exports.handle = handle;
