/**
 * path this handler will serve
 */
function path() {
  return "/admin/queues";
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const queueList = await dependencies.cache.systemQueues.fetchSystemQueues();
  res.render(dependencies.viewsPath + "admin/queues", {
    queues: queueList != null ? queueList : []
  });
}

module.exports.path = path;
module.exports.handle = handle;
