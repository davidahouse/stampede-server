/**
 * handle repository
 * @param {*} req 
 * @param {*} res 
 * @param {*} redisClient 
 * @param {*} path 
 */
async function handle(req, res, redisClient, path) {
  const pullRequestConfig = await redisClient.fetch('stampede-' + req.query.org + '-' + req.query.repo + '-pullrequest', {})
  const builds = await redisClient.fetchKeys('stampede-' + req.query.org + '-' + req.query.repo + '-pullrequest-*')
  console.dir(builds)
  res.render(path + 'repository', {org: req.query.org, repo: req.query.repo, 
                                    pullRequestConfig: JSON.stringify(pullRequestConfig, null, 2)})
}

module.exports.handle = handle