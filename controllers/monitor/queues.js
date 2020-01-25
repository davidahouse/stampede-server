const Queue = require("bull");

/**
 * handle queues
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 * @param {*} conf
 */
async function handle(req, res, cache, db, path, conf) {
  const redisConfig = {
    redis: {
      port: conf.redisPort,
      host: conf.redisHost,
      password: conf.redisPassword
    }
  };
  const queueList = await cache.systemQueues.fetchSystemQueues();
  const queues = [];

  for (let index = 0; index < queueList.length; index++) {
    const q = new Queue("stampede-" + queueList[index].id, redisConfig);
    const stats = await q.getJobCounts();
    queues.push({
      queue: queueList[index].id,
      stats: stats
    });
  }
  res.render(path + "monitor/queues", { queues: queues });
}

module.exports.handle = handle;
