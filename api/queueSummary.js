"use strict";
const Queue = require("bull");

/**
 * handle queueSummary
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 * @param {*} cache
 * @param {*} db
 */
async function handle(req, res, serverConf, cache, db) {
  const redisConfig = {
    redis: {
      port: serverConf.redisPort,
      host: serverConf.redisHost,
      password: serverConf.redisPassword
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
  res.send(queues);
}

module.exports.handle = handle;
