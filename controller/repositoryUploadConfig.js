/**
 * handle repository
 * @param {*} req 
 * @param {*} res 
 * @param {*} redisClient 
 * @param {*} path 
 */
async function handle(req, res, redisClient, path) {
    res.render(path + 'repositoryUploadConfig', {org: req.query.org, repo: req.query.repo})
  }
  
  module.exports.handle = handle