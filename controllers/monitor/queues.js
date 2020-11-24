const Queue = require("bull");

/**
 * path this handler will serve
 */
function path() {
  return "/monitor/queues";
}

/**
 * handle queues
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  // Fetch the task queues
  const queueList = await dependencies.cache.systemQueues.fetchSystemQueues();
  const queues = [];
  if (queueList != null) {
    for (let index = 0; index < queueList.length; index++) {
      let stats = await queueStats(
        queueList[index].id,
        dependencies.redisConfig
      );
      queues.push({
        queue: queueList[index].id,
        stats: stats,
      });
    }
  }

  const systemQueues = [];
  let incomingStats = await queueStats(
    dependencies.serverConfig.incomingQueue,
    dependencies.redisConfig
  );
  systemQueues.push({
    queue: dependencies.serverConfig.incomingQueue,
    stats: incomingStats,
  });
  let responseStats = await queueStats(
    dependencies.serverConfig.responseQueue,
    dependencies.redisConfig
  );
  systemQueues.push({
    queue: dependencies.serverConfig.responseQueue,
    stats: responseStats,
  });
  let notificationStats = await queueStats(
    "notification",
    dependencies.redisConfig
  );
  systemQueues.push({
    queue: "notification",
    stats: notificationStats,
  });

  res.render(dependencies.viewsPath + "monitor/queues", {
    owners: owners,
    isAdmin: req.validAdminSession,
    taskQueues: queues,
    systemQueues: systemQueues,
  });
}

/**
 * Collect queue stats
 * @param {*} queue
 * @param {*} redisConfig
 */
async function queueStats(queue, redisConfig) {
  const q = new Queue("stampede-" + queue, redisConfig);
  const stats = await q.getJobCounts();
  return stats;
}

module.exports.path = path;
module.exports.handle = handle;
