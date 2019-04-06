async function handle(req, res, redisClient) {

    const jobKey = 'job_' + req.params.job
    console.log(jobKey)
    const jobDetails = await redisClient.get(jobKey)

    await redisClient.lpush('jobRequests', jobDetails)
    res.send(jobDetails)
}

module.exports.handle = handle