/**
 * path this handler will serve
 */
function path() {
  return "/history/builds";
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

  let buildKeyFilter = "All";
  if (req.query.buildKey != null) {
    buildKeyFilter = req.query.buildKey;
  }

  let repositoryFilter = "All";
  if (req.query.repository != null) {
    repositoryFilter = req.query.repository;
  }

  const buildKeyRows = await dependencies.db.fetchRecentBuildKeys(
    timeFilter,
    repositoryFilter
  );
  let buildKeyList = [];
  buildKeyList.push("All");
  for (let index = 0; index < buildKeyRows.rows.length; index++) {
    buildKeyList.push(buildKeyRows.rows[index].build_key);
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

  let sourceFilter = "All";
  if (req.query.source != null) {
    sourceFilter = req.query.source;
  }

  const sources = [
    "All",
    "Pull Request",
    "Branch",
    "Release",
    "Repository Build",
  ];

  const builds = await dependencies.db.recentBuilds(
    timeFilter,
    buildKeyFilter,
    repositoryFilter,
    sourceFilter
  );

  res.render(dependencies.viewsPath + "history/builds", {
    owners: owners,
    isAdmin: req.validAdminSession,
    builds: builds.rows,
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
      "This Month",
      "Last Month",
      "2 Months Ago",
      "3 Months Ago",
      "4+ Months Ago",
    ],
    buildKeyFilter: buildKeyFilter,
    buildKeyList: buildKeyList,
    repositoryFilter: repositoryFilter,
    repositoryList: repositories,
    sourceFilter: sourceFilter,
    sourceList: sources,
  });
}

module.exports.path = path;
module.exports.handle = handle;
