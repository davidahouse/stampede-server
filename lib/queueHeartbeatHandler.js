const notification = require("../services/notification");
const Queue = require("bull");

async function handle(dependencies) {
  try {
    const queueList = await dependencies.cache.systemQueues.fetchSystemQueues();
    const queues = [];
    let totalWaiting = 0;
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
        totalWaiting += stats.waiting;
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
    totalWaiting += incomingStats.waiting;
    let responseStats = await queueStats(
      dependencies.serverConfig.responseQueue,
      dependencies.redisConfig
    );
    systemQueues.push({
      queue: dependencies.serverConfig.responseQueue,
      stats: responseStats,
    });
    totalWaiting += responseStats.waiting;
    let notificationStats = await queueStats(
      "notification",
      dependencies.redisConfig
    );
    systemQueues.push({
      queue: "notification",
      stats: notificationStats,
    });
    totalWaiting += notificationStats.waiting;

    notification.queueHeartbeat({
      taskQueues: queues,
      systemQueues: systemQueues,
      totalWaiting: totalWaiting,
    });
  } catch (e) {
    dependencies.logger.error("Error in queue heartbeat handler: " + e);
  }
}

/**
 * Collect queue stats
 * @param {*} queue
 * @param {*} redisConfig
 */
async function queueStats(queue, redisConfig) {
  const q = new Queue("stampede-" + queue, redisConfig);
  const stats = await q.getJobCounts();
  q.close();
  return stats;
}

module.exports.handle = handle;
