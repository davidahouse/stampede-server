const prettyMilliseconds = require("pretty-ms");

/**
 * handle workers
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const workers = await cache.fetchActiveWorkers();
  const sortedWorkers = workers.sort(function(a, b) {
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
  res.render(path + "monitor/workers", {
    workers: sortedWorkers,
    prettyMilliseconds: ms => (ms != null ? prettyMilliseconds(ms) : "")
  });
}

module.exports.handle = handle;
