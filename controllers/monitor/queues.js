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
async function handle(req, res, dependencies) {
  const queueList = await dependencies.cache.systemQueues.fetchSystemQueues();
  const queues = [];

  for (let index = 0; index < queueList.length; index++) {
    const q = new Queue(
      "stampede-" + queueList[index].id,
      dependencies.redisConfig
    );
    const stats = await q.getJobCounts();
    queues.push({
      queue: queueList[index].id,
      stats: stats
    });
  }
  res.render(dependencies.viewsPath + "monitor/queues", { queues: queues });
}

module.exports.path = path;
module.exports.handle = handle;
