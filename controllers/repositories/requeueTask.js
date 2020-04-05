const Queue = require("bull");

/**
 * path this handler will serve
 */
function path() {
  return "/repositories/requeueTask";
}

/**
 * handle requeueTask
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const taskRows = await dependencies.db.fetchTask(req.query.taskID);
  const task = taskRows.rows[0];
  const detailsRows = await dependencies.db.fetchTaskDetails(req.query.taskID);
  const taskDetails = detailsRows.rows[0].details;

  taskDetails.stats.started_at = null;
  taskDetails.stats.finished_at = null;
  taskDetails.worker = {};
  taskDetails.result = {};
  taskDetails.staus = "queued";
  const buildRows = await dependencies.db.fetchBuild(task.build_id);
  const build = buildRows.rows[0];

  // Figure out the task queue
  const taskQueue = new Queue(
    "stampede-" + taskDetails.taskQueue,
    dependencies.redisConfig
  );
  taskQueue.add(taskDetails, { removeOnComplete: true, removeOnFail: true });
  taskQueue.close();

  res.render(dependencies.viewsPath + "repositories/requeueTask", {
    owners: owners,
    task: task,
    taskDetails: taskDetails,
    build: build,
  });
}

module.exports.path = path;
module.exports.handle = handle;
