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

  const buildKeyRows = await dependencies.db.fetchRecentBuildKeys(timeFilter);
  let buildKeyList = [];
  buildKeyList.push("All");
  for (let index = 0; index < buildKeyRows.rows.length; index++) {
    buildKeyList.push(buildKeyRows.rows[index].build_key);
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

  const builds = await dependencies.db.recentBuilds(
    timeFilter,
    buildKeyFilter,
    repositoryFilter
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
    ],
    buildKeyFilter: buildKeyFilter,
    buildKeyList: buildKeyList,
    repositoryFilter: repositoryFilter,
    repositoryList: repositories,
  });
}

module.exports.path = path;
module.exports.handle = handle;
