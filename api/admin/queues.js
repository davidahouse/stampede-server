"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/admin/queues";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const queueList = await dependencies.cache.systemQueues.fetchSystemQueues();
  res.send(queueList);
}

module.exports.path = path;
module.exports.handle = handle;
