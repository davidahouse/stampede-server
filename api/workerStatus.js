"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/workerStatus";
}

/**
 * handle workerStatus
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const activeWorkers = await dependencies.cache.fetchActiveWorkers();
  res.send(activeWorkers);
}

module.exports.path = path;
module.exports.handle = handle;
