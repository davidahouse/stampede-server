async function handle(req, res, redisClient) {
    const jobs = await redisClient.get('jobs')
    res.send(jobs)
}

module.exports.handle = handle