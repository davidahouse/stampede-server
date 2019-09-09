/**
 * handle repository
 * @param {*} req 
 * @param {*} res 
 * @param {*} redisClient 
 * @param {*} path 
 */
async function handle(req, res, redisClient, path) {
  const prTasks = await redisClient.fetch('stampede-' + req.query.org + '-' + req.query.repo + '-pullrequest', [])
  console.dir(prTasks)
  res.render(path + 'repository', {org: req.query.org, repo: req.query.repo, 
                                    prConfig: Object.entries(prTasks.config),
                                    prTasks: prTasks.tasks})
}

module.exports.handle = handle