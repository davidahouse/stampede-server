const Queue = require("bull");

/**
 * handle requeueTask
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path, redisConfig) {
  const taskRows = await db.fetchTask(req.query.taskID);
  const task = taskRows.rows[0];
  const detailsRows = await db.fetchTaskDetails(req.query.taskID);
  const taskDetails = detailsRows.rows[0].details;
  const buildRows = await db.fetchBuild(task.build_id);
  const build = buildRows.rows[0];

  taskDetails.stats.finished_at = new Date();
  taskDetails.status = "completed";
  taskDetails.result = {
    conclusion: "cancelled"
  };

  const taskQueue = new Queue("stampede-response", redisConfig);
  taskQueue.add(
    { response: "taskUpdate", payload: taskDetails },
    { removeOnComplete: true, removeOnFail: true }
  );
  taskQueue.close();
  res.render(path + "monitor/cancelTask", {
    task: task,
    taskDetails: taskDetails,
    build: build
  });
}

module.exports.handle = handle;
