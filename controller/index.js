
async function handle(req, res, redisClient, path) {
  res.render(path + 'index', {})
}

module.exports.handle = handle