'use strict'

/**
 * handle workerStatus
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 * @param {*} cache
 * @param {*} db
 */
async function handle(req, res, serverConf, cache, db) {
  const activeWorkers = await cache.fetchActiveWorkers()
  res.send(activeWorkers)
}

module.exports.handle = handle
