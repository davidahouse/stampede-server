/**
 * handle repositories
 * @param {*} req 
 * @param {*} res 
 * @param {*} redisClient 
 * @param {*} path 
 */
async function handle(req, res, redisClient, path) {
  const repos = await redisClient.fetchMembers('stampede-orgs-' + req.query.org, [])
  res.render(path + 'repositories', {org: req.query.org, repos: repos})
}

module.exports.handle = handle