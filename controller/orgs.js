/**
 * handle orgs
 * @param {*} req 
 * @param {*} res 
 * @param {*} redisClient 
 * @param {*} path 
 */
async function handle(req, res, serverConf, redisClient, path) {
  const orgs = await redisClient.fetchMembers('stampede-orgs', [])
  res.render(path + 'orgs', {orgs: orgs})
}

module.exports.handle = handle