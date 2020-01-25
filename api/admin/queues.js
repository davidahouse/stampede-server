"use strict";

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 * @param {*} cache
 * @param {*} db
 */
async function handle(req, res, serverConf, cache, db) {
  const queueList = await cache.systemQueues.fetchSystemQueues();
  res.send(queueList);
}

module.exports.handle = handle;
