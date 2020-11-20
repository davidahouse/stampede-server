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
    let stats = await queueStats("stampede-" + queueList[index].id, redisConfig)
    queues.push({
      queue: queueList[index].id,
      stats: stats,
    });
  }

  const systemQueues = []
  let incomingStats = await queueStats(dependencies.serverConfig.incomingQueue, redisConfig)
  systemQueues.push({
    queue: dependencies.serverConfig.incomingQueue,
    stats: incomingStats
  })
  let responseStats = await queueStats(dependencies.serverConfig.responseQueue, redisConfig)
  systemQueues.push({
    queue: dependencies.serverConfig.responseQueue,
    stats: responseStats
  })
  if (dependencies.serverConfig.handleSlackNotifications === "enabled") {
    let slackStats = await queueStats("slack-notifications", dependencies.redisConfig)
    systemQueues.push({
      queue: "slack-notifications",
      stats: slackStats
    })
  }
  if (dependencies.serverConfig.handlePRCommentNotifications === "enabled") {
    let prCommentStats = await queueStats("prcomment-notifications", dependencies.redisConfig)
    systemQueues.push({
      queue: "prcomment-notifications",
      stats: prCommentStats
    })
  }

  res.send({ taskQueues: queues, systemQueues: systemQueues });
}

/**
 * Collect queue stats
 * @param {*} queue 
 * @param {*} redisConfig 
 */
async function queueStats(queue, redisConfig) {
  const q = new Queue(
    "stampede-" + queue,
    redisConfig
  );
  const stats = await q.getJobCounts();
  return stats
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "monitor-queueSummary",
      parameters: [],
      responses: {
        200: {
          description: "",
        },
      },
    },
  };
}

module.exports.path = path;
module.exports.handle = handle;
module.exports.docs = docs;
