/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const queueList = await cache.systemQueues.fetchSystemQueues();
  res.render(path + "admin/queues", {
    queues: queueList != null ? queueList : []
  });
}

module.exports.handle = handle;
