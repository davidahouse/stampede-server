async function handle(req, res, redisClient) {

    const jobKey = 'job_' + req.params.job
    console.log(jobKey)
    const rawJobDetails = await redisClient.get(jobKey)
    const jobDetails = JSON.parse(rawJobDetails)
    let queue = 'jobDefaultQueue'
    if (jobDetails.queue != null) {
        queue = jobDetails.queue
    }

    const jobBuildKey = 'job_' + req.params.job + '_build'
    await redisClient.incr(jobBuildKey)
    let buildNumber = await redisClient.get(jobBuildKey)

    const jobIdentifier = 'job_' + req.params.job + '_' + buildNumber

    const status = {status: 'queued', queueTime: new Date()}
    const job = {queue: queue, status: status, build: buildNumber, details: jobDetails}
    await redisClient.set(jobIdentifier, JSON.stringify(job))
    await redisClient.expire(jobIdentifier, 3600)
    await redisClient.lpush(queue, jobIdentifier)
    res.send(job)
}

module.exports.handle = handle