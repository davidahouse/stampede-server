const Queue = require("bull");

/**
 * path this handler will serve
 */
function path() {
  return "/monitor/cancelTask";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const taskRows = await dependencies.db.fetchTask(req.query.taskID);
  const task = taskRows.rows[0];
  if (task != null) {
    const detailsRows = await dependencies.db.fetchTaskDetails(
      req.query.taskID
    );
    const taskDetails = detailsRows.rows[0].details;
    const buildRows = await dependencies.db.fetchBuild(task.build_id);
    const build = buildRows.rows[0];

    taskDetails.stats.finished_at = new Date();
    taskDetails.status = "completed";
    taskDetails.result = {
      conclusion: "cancelled",
    };

    const taskQueue = new Queue("stampede-response", dependencies.redisConfig);
    taskQueue.add(
      { response: "taskUpdate", payload: taskDetails },
      { removeOnComplete: true, removeOnFail: true }
    );
    taskQueue.close();
    res.render(dependencies.viewsPath + "monitor/cancelTask", {
      owners: owners,
      task: task,
      taskDetails: taskDetails,
      build: build,
    });
  } else {
    res.render(dependencies.viewsPath + "monitor/cancelTask", {
      owners: owners,
      task: {},
      taskDetails: { details: {} },
      build: {},
    });
  }
}

module.exports.path = path;
module.exports.handle = handle;
