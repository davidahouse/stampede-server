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
async function handle(req, res, dependencies) {
  const builds = await dependencies.db.recentBuilds(8, 50);
  res.render(dependencies.viewsPath + "history/builds", {
    builds: builds.rows
  });
}

module.exports.path = path;
module.exports.handle = handle;
