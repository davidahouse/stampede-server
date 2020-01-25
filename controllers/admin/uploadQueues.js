const yaml = require("js-yaml");

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const uploadData = req.files.uploadFile;
  const uploadQueues = yaml.safeLoad(uploadData.data);
  if (uploadQueues != null) {
    await cache.systemQueues.storeSystemQueues(uploadQueues);
  }

  const queueList = await cache.systemQueues.fetchSystemQueues();
  res.render(path + "admin/queues", {
    queues: queueList != null ? queueList : []
  });
}

module.exports.handle = handle;
