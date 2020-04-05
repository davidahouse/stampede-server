/**
 * path this handler will serve
 */
function path() {
  return "/history/tasks";
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

  const taskList = await dependencies.cache.fetchTasks();
  const sortedTasks = taskList.sort();
  sortedTasks.unshift("All");

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

  const conclusionList = ["All", "success", "failure"];
  let conclusionFilter = "All";
  if (req.query.conclusion != null) {
    conclusionFilter = req.query.conclusion;
  }

  const sortList = [
    "Date",
    "Date DESC",
    "Task",
    "Owner",
    "Repository",
    "Conclusion",
  ];
  let sorted = "Date DESC";
  if (req.query.sorted != null) {
    sorted = req.query.sorted;
  }

  let nodeFilter = "All";
  if (req.query.node != null) {
    nodeFilter = req.query.node;
  }

  const nodesRows = await dependencies.db.fetchNodes();
  const nodeList = [];
  nodeList.push("All");
  for (let index = 0; index < nodesRows.rows.length; index++) {
    nodeList.push(nodesRows.rows[index].node);
  }

  const tasks = await dependencies.db.recentTasks(
    timeFilter,
    taskFilter,
    repositoryFilter,
    conclusionFilter,
    nodeFilter,
    sorted
  );

  res.render(dependencies.viewsPath + "history/tasks", {
    owners: owners,
    tasks: tasks.rows,
    timeFilter: timeFilter,
    timeFilterList: ["Last 8 hours", "Today", "Yesterday"],
    taskFilter: taskFilter,
    taskList: sortedTasks,
    repositoryFilter: repositoryFilter,
    repositoryList: repositories,
    conclusionList: conclusionList,
    conclusionFilter: conclusionFilter,
    nodeList: nodeList,
    nodeFilter: nodeFilter,
    sortList: sortList,
    sorted: sorted,
  });
}

module.exports.path = path;
module.exports.handle = handle;
