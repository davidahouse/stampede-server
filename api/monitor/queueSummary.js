"use strict";
const Queue = require("bull");

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/monitor/queueSummary";
}

/**
 * handle queueSummary
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const redisConfig = {
    redis: {
      port: dependencies.serverConfig.redisPort,
      host: dependencies.serverConfig.redisHost,
      password: dependencies.serverConfig.redisPassword,
    },
  };
  const queueList = await dependencies.cache.systemQueues.fetchSystemQueues();
  const queues = [];

  for (let index = 0; index < queueList.length; index++) {
    const q = new Queue("stampede-" + queueList[index].id, redisConfig);
    const stats = await q.getJobCounts();
    queues.push({
      queue: queueList[index].id,
      stats: stats,
    });
  }
  res.send(queues);
}

module.exports.path = path;
module.exports.handle = handle;
