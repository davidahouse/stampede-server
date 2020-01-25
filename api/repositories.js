'use strict'

/**
 * handle activeBuilds
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 * @param {*} cache
 * @param {*} db
 */
async function handle(req, res, serverConf, cache, db) {
  const repositories = await db.fetchRepositories()
  res.send(repositories != null ? repositories.rows : [])
}

module.exports.handle = handle
