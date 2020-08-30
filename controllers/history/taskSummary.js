const prettyMilliseconds = require("pretty-ms");

/**
 * path this handler will serve
 */
function path() {
  return "/history/taskSummary";
}

/**
 * handle buildSummary
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  let timeFilter = "Last 8 hours";
  if (req.query.time != null) {
    timeFilter = req.query.time;
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

  const taskList = await dependencies.cache.fetchTasks();
  const sortedTasks = taskList.sort();

  const graphs = [];
  for (let index = 0; index < sortedTasks.length; index++) {
    const tasks = await dependencies.db.recentTasks(
      timeFilter,
      sortedTasks[index],
      repositoryFilter,
      "All",
      "All",
      "Date DESC"
    );

    const taskLabels = [];
    const taskData = [];
    const taskColor = [];
    const summary = {
      total: {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: 999999,
        maxDuration: 0,
      },
      success: {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: 999999,
        maxDuration: 0,
      },
      failure: {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: 999999,
        maxDuration: 0,
      },
    };

    for (let tindex = 0; tindex < tasks.rows.length; tindex++) {
      if (
        tasks.rows[tindex].started_at != null &&
        tasks.rows[tindex].finished_at &&
        tasks.rows[tindex].conclusion
      ) {
        taskLabels.push(tasks.rows[tindex].task_id);
        const duration =
          (tasks.rows[tindex].finished_at - tasks.rows[tindex].started_at) /
          1000.0;
        if (tasks.rows[tindex].conclusion === "success") {
          summary.success.count = summary.success.count + 1;
          summary.success.totalDuration =
            summary.success.totalDuration + duration;
          if (summary.success.minDuration > duration) {
            summary.success.minDuration = duration;
          }
          if (summary.success.maxDuration < duration) {
            summary.success.maxDuration = duration;
          }
          taskColor.push("rgba(0, 255, 0, 0.6)");
        } else {
          summary.failure.count = summary.failure.count + 1;
          summary.failure.totalDuration =
            summary.failure.totalDuration + duration;
          if (summary.failure.minDuration > duration) {
            summary.failure.minDuration = duration;
          }
          if (summary.failure.maxDuration < duration) {
            summary.failure.maxDuration = duration;
          }
          taskColor.push("rgba(255, 0, 0, 0.6)");
        }
        taskData.push(duration);
        summary.total.count = summary.total.count + 1;
        summary.total.totalDuration = summary.total.totalDuration + duration;
        if (summary.total.minDuration > duration) {
          summary.total.minDuration = duration;
        }
        if (summary.total.maxDuration < duration) {
          summary.total.maxDuration = duration;
        }
      }
    }

    if (summary.total.count > 0) {
      summary.total.avgDuration =
        summary.total.totalDuration / summary.total.count;
    } else {
      summary.total.minDuration = 0;
    }
    if (summary.success.count > 0) {
      summary.success.avgDuration =
        summary.success.totalDuration / summary.success.count;
    } else {
      summary.success.minDuration = 0;
    }
    if (summary.failure.count > 0) {
      summary.failure.avgDuration =
        summary.failure.totalDuration / summary.failure.count;
    } else {
      summary.failure.minDuration = 0;
    }

    let data = {
      labels: taskLabels,
      datasets: [
        {
          label: "Duration",
          data: taskData,
          backgroundColor: taskColor,
        },
      ],
    };

    graphs.push({
      task: sortedTasks[index],
      data: data,
      summary: summary,
    });
  }

  res.render(dependencies.viewsPath + "history/taskSummary", {
    owners: owners,
    isAdmin: req.validAdminSession,
    graphs: graphs,
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
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

module.exports.path = path;
module.exports.handle = handle;
