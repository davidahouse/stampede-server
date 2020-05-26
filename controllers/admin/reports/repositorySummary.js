/**
 * path this handler will serve
 */
function path() {
  return "/admin/reports/repositorySummary";
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
  const repositorySummary = await dependencies.db.repositorySummary();
  const totals = {
    repositories: 0,
    builds: 0,
    tasks: 0,
  };

  for (var index = 0; index < repositorySummary.rows.length; index++) {
    totals.repositories = totals.repositories + 1;
    totals.builds =
      totals.builds + parseInt(repositorySummary.rows[index].buildcount);
    totals.tasks =
      totals.tasks + parseInt(repositorySummary.rows[index].taskcount);
  }

  res.render(dependencies.viewsPath + "admin/reports/repositorySummary", {
    owners: owners,
    isAdmin: req.validAdminSession,
    summary: repositorySummary.rows,
    totals: totals,
  });
}

module.exports.path = path;
module.exports.handle = handle;
