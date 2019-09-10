const yaml = require('js-yaml')

/**
 * Handle testUserEndpoint
 * @param {*} req
 * @param {*} res
 * @param {*} redisClient
 * @param {*} path
 */
async function handle(req, res, redisClient, path) {
    const data = yaml.safeLoad(req.files.endpoint.data)
    await redisClient.store('stampede-' + req.query.org + '-' + req.query.repo + '-pullrequest', data)
    res.render(path + 'repository', {org: req.query.org, repo: req.query.repo})
}
  
module.exports.handle = handle
  