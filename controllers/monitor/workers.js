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
  res.render(path + "monitor/workers", {
    workers: workers,
    prettyMilliseconds: ms => (ms != null ? prettyMilliseconds(ms) : "")
  });
}

module.exports.handle = handle;
