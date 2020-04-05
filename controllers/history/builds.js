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

  const buildKeyRows = await dependencies.db.fetchRecentBuildKeys();
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
    builds: builds.rows,
    timeFilter: timeFilter,
    timeFilterList: ["Last 8 hours", "Today", "Yesterday"],
    buildKeyFilter: buildKeyFilter,
    buildKeyList: buildKeyList,
    repositoryFilter: repositoryFilter,
    repositoryList: repositories,
  });
}

module.exports.path = path;
module.exports.handle = handle;
