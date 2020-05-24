/**
 * path this handler will serve
 */
function path() {
  return "/history/taskHealth";
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  let timeFilter = "Last 8 hours";
  if (req.query.time != null) {
    timeFilter = req.query.time;
  }

  let taskFilter = "All";
  if (req.query.task != null) {
    taskFilter = req.query.task;
  }

  let repositoryFilter = "All";
  if (req.query.repository != null) {
    repositoryFilter = req.query.repository;
  }

  const repositoriesRows = await dependencies.db.fetchRepositories();
  const repositories = [];
  repositories.push("All");
  for (let index = 0; index < repositoriesRows.rows.length; index++) {
    repositories.push(
      repositoriesRows.rows[index].owner +
        "/" +
        repositoriesRows.rows[index].repository
    );
  }

  const tasksRows = await dependencies.db.taskHealth(
    timeFilter,
    repositoryFilter
  );

  const tasks = [];
  for (let index = 0; index < tasksRows.rows.length; index++) {
    let foundTask = false;
    for (let tindex = 0; tindex < tasks.length; tindex++) {
      if (tasksRows.rows[index].task === tasks[tindex].task) {
        if (tasksRows.rows[index].conclusion === "success") {
          tasks[tindex].successCount =
            tasks[tindex].successCount + parseInt(tasksRows.rows[index].count);
        } else {
          tasks[tindex].failureCount =
            tasks[tindex].failureCount + parseInt(tasksRows.rows[index].count);
        }
        foundTask = true;
      }
    }
    if (foundTask === false) {
      if (tasksRows.rows[index].conclusion === "success") {
        tasks.push({
          task: tasksRows.rows[index].task,
          successCount: parseInt(tasksRows.rows[index].count),
          failureCount: 0,
        });
      } else {
        tasks.push({
          task: tasksRows.rows[index].task,
          successCount: 0,
          failureCount: parseInt(tasksRows.rows[index].count),
        });
      }
    }
  }

  res.render(dependencies.viewsPath + "history/taskHealth", {
    owners: owners,
    isAdmin: req.validAdminSession,
    tasks: tasks,
    timeFilter: timeFilter,
    timeFilterList: [
      "Last 8 hours",
      "Last 12 hours",
      "Today",
      "Yesterday",
      "Last 3 Days",
      "Last 7 Days",
      "Last 14 Days",
      "Last 30 Days",
    ],
    repositoryFilter: repositoryFilter,
    repositoryList: repositories,
  });
}

module.exports.path = path;
module.exports.handle = handle;
