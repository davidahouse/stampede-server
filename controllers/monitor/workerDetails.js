/**
 * path this handler will serve
 */
function path() {
  return "/monitor/workerDetails";
}

/**
 * handle worker details
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const workers = await dependencies.cache.fetchActiveWorkers();
  let worker = null;
  for (let index = 0; index < workers.length; index++) {
    if (workers[index].workerID === req.query.workerID) {
      worker = workers[index];
    }
  }
  console.dir(worker);
  res.render(dependencies.viewsPath + "monitor/workerDetails", {
    worker: worker != null ? worker : { lastTask: {} }
  });
}

module.exports.path = path;
module.exports.handle = handle;
