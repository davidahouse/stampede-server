const prettyMilliseconds = require("pretty-ms");

/**
 * path this handler will serve
 */
function path() {
  return "/monitor/workers";
}

/**
 * handle workers
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const workers = await dependencies.cache.fetchActiveWorkers();
  const sortedWorkers = workers.sort(function (a, b) {
    if (a.node < b.node) {
      return -1;
    } else if (a.node > b.node) {
      return 1;
    } else {
      if (a.workerName < b.workerName) {
        return -1;
      } else if (a.workerName > b.workerName) {
        return 1;
      }
    }
    return 0;
  });
  res.render(dependencies.viewsPath + "monitor/workers", {
    owners: owners,
    isAdmin: req.validAdminSession,
    workers: sortedWorkers,
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

module.exports.path = path;
module.exports.handle = handle;
