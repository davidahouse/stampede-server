/**
 * path this handler will serve
 */
function path() {
  return "/admin/reports/taskParameterValues";
}

/**
 * if the route requires admin
 */
function requiresAdmin() {
  return true;
}

/**
 * handle dailySummary
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const parameters = [];

  let timeFilter = "Last 8 hours";
  if (req.query.time != null) {
    timeFilter = req.query.time;
  }

  let taskFilter = "None";
  if (req.query.task != null) {
    taskFilter = req.query.task;
  }

  const taskList = await dependencies.cache.fetchTasks();
  const sortedTasks = taskList != null ? taskList.sort() : [];
  sortedTasks.unshift("None");

  const tasks = await dependencies.db.recentTasks(
    timeFilter,
    taskFilter,
    "All",
    "All",
    "All",
    "Date DESC"
  );

  if (tasks != null) {
    for (let index = 0; index < tasks.rows.length; index++) {
      const details = await dependencies.db.fetchTaskDetails(
        tasks.rows[index].task_id
      );
      if (details != null && details.rows.length > 0) {
        const taskDetails = details.rows[0];
        if (taskDetails.details.config != null) {
          Object.keys(taskDetails.details.config).forEach(function (key) {
            let found = false;
            for (let pindex = 0; pindex < parameters.length; pindex++) {
              if (
                parameters[pindex].key === key &&
                parameters[pindex].value ===
                  taskDetails.details.config[key].value &&
                parameters[pindex].repository ===
                  taskDetails.details.owner +
                    "/" +
                    taskDetails.details.repository
              ) {
                parameters[pindex].count = parameters[pindex].count + 1;
                found = true;
              }
            }

            if (!found) {
              parameters.push({
                key: key,
                value: taskDetails.details.config[key].value,
                count: 1,
                repository:
                  taskDetails.details.owner +
                  "/" +
                  taskDetails.details.repository,
              });
            }
          });
        }
      }
    }
  }

  const sortedParameters = parameters.sort(function (a, b) {
    if (a.key < b.key) {
      return -1;
    } else if (a.key > b.key) {
      return 1;
    } else {
      return 0;
    }
  });

  res.render(dependencies.viewsPath + "admin/reports/taskParameterValues", {
    owners: owners,
    isAdmin: req.validAdminSession,
    parameters: sortedParameters,
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
    taskFilter: taskFilter,
    taskList: sortedTasks,
  });
}

module.exports.path = path;
module.exports.handle = handle;
