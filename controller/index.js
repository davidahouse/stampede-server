'use strict'
/**
 * handle index
 * @param {*} req 
 * @param {*} res 
 * @param {*} redisClient 
 * @param {*} path 
 */
async function handle(req, res, redisClient, path) {
  res.render(path + 'index', {version: module.exports.version})
}

module.exports.handle = handle
