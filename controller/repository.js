'use strict'
/**
 * handle repository
 * @param {*} req 
 * @param {*} res 
 * @param {*} redisClient 
 * @param {*} path 
 */
async function handle(req, res, redisClient, path) {
  const config = await redisClient.fetch('stampede-' + req.query.org + '-' + req.query.repo + '-config', {})
  res.render(path + 'repository', {org: req.query.org, repo: req.query.repo, 
                                    config: JSON.stringify(config, null, 2)})
}

module.exports.handle = handle