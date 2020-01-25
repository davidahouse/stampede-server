/**
 * handle worker details
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const workers = await cache.fetchActiveWorkers();
  let worker = null;
  for (let index = 0; index < workers.length; index++) {
    if (workers[index].workerID === req.query.workerID) {
      worker = workers[index];
    }
  }
  console.dir(worker);
  res.render(path + 'monitor/workerDetails', { worker: worker });
}

module.exports.handle = handle;
