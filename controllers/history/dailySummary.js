/**
 * handle dailySummary
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  let todayBuildsCount = "";
  const todayBuilds = await db.countRecentBuilds("Today");
  if (todayBuilds.rows.length > 0) {
    todayBuildsCount = todayBuilds.rows[0].count;
  }

  let yesterdayBuildsCount = "";
  const yesterdayBuilds = await db.countRecentBuilds("Yesterday");
  if (yesterdayBuilds.rows.length > 0) {
    yesterdayBuildsCount = yesterdayBuilds.rows[0].count;
  }

  let todayTasksCount = "";
  const todayTasks = await db.countRecentTasks("Today");
  if (todayTasks.rows.length > 0) {
    todayTasksCount = todayTasks.rows[0].count;
  }

  let yesterdayTasksCount = "";
  const yesterdayTasks = await db.countRecentTasks("Yesterday");
  if (yesterdayTasks.rows.length > 0) {
    yesterdayTasksCount = yesterdayTasks.rows[0].count;
  }

  const buildSummary = await db.summarizeRecentBuilds();
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
        backgroundColor: "rgba(0, 255, 0, 0.6)"
      }
    ]
  };

  const taskSummary = await db.summarizeRecentTasks();

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
        backgroundColor: "rgba(0, 255, 0, 0.6)"
      }
    ]
  };

  res.render(path + "history/dailySummary", {
    yesterdayBuilds: yesterdayBuildsCount,
    yesterdayTasks: yesterdayTasksCount,
    todayBuilds: todayBuildsCount,
    todayTasks: todayTasksCount,
    builds: builds,
    tasks: tasks
  });
}

module.exports.handle = handle;
