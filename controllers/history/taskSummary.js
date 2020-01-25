/**
 * handle buildSummary
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  let timeFilter = "Last 8 hours";
  if (req.query.time != null) {
    timeFilter = req.query.time;
  }

  let repositoryFilter = "All";
  if (req.query.repository != null) {
    repositoryFilter = req.query.repository;
  }

  const repositoriesRows = await db.fetchRepositories();
  const repositories = [];
  repositories.push("All");
  for (let index = 0; index < repositoriesRows.rows.length; index++) {
    repositories.push(
      repositoriesRows.rows[index].owner +
        "/" +
        repositoriesRows.rows[index].repository
    );
  }

  const taskList = await cache.fetchTasks();
  const sortedTasks = taskList.sort();

  const graphs = [];
  for (let index = 0; index < sortedTasks.length; index++) {
    const tasks = await db.recentTasks(
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
      total: 0,
      success: 0,
      failure: 0,
      totalDuration: 0,
      avgDuration: 0,
      minDuration: 999999,
      maxDuration: 0
    };

    for (let tindex = 0; tindex < tasks.rows.length; tindex++) {
      if (
        tasks.rows[tindex].started_at != null &&
        tasks.rows[tindex].finished_at &&
        tasks.rows[tindex].conclusion
      ) {
        taskLabels.push(tasks.rows[tindex].task_id);
        if (tasks.rows[tindex].conclusion === "success") {
          summary.success = summary.success + 1;
          taskColor.push("rgba(0, 255, 0, 0.6)");
        } else {
          summary.failure = summary.failure + 1;
          taskColor.push("rgba(255, 0, 0, 0.6)");
        }
        const duration =
          (tasks.rows[tindex].finished_at - tasks.rows[tindex].started_at) /
          1000.0;
        taskData.push(duration);
        summary.total = summary.total + 1;
        summary.totalDuration = summary.totalDuration + duration;
        if (summary.minDuration > duration) {
          summary.minDuration = duration;
        }
        if (summary.maxDuration < duration) {
          summary.maxDuration = duration;
        }
      }
    }

    if (summary.total > 0) {
      summary.avgDuration = summary.totalDuration / summary.total;
    }

    let data = {
      labels: taskLabels,
      datasets: [
        {
          label: "Duration",
          data: taskData,
          backgroundColor: taskColor
        }
      ]
    };

    graphs.push({
      task: sortedTasks[index],
      data: data,
      summary: summary
    });
  }

  res.render(path + "history/taskSummary", {
    graphs: graphs,
    timeFilter: timeFilter,
    timeFilterList: ["Last 8 hours", "Today", "Yesterday"],
    repositoryFilter: repositoryFilter,
    repositoryList: repositories
  });
}

module.exports.handle = handle;
