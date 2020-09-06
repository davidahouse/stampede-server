const Queue = require("bull");

/**
 * path this handler will serve
 */
function path() {
  return "/monitor/cancelBuild";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const buildID = req.query.buildID;
  await dependencies.cache.removeBuildFromActiveList(buildID);

  const remainingTasks = await dependencies.cache.fetchActiveTasks(buildID);
  for (let index = 0; index < remainingTasks.length; index++) {
    const detailsRows = await dependencies.db.fetchTaskDetails(
      remainingTasks[index]
    );
    const taskDetails = detailsRows.rows[0].details;
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
  }

  try {
    await dependencies.db.storeBuildComplete(buildID, "cancelled");
  } catch (e) {
    logger.error("Error storing build completed details: " + e);
  }

  res.render(dependencies.viewsPath + "monitor/cancelBuild", {
    owners: owners,
    isAdmin: req.validAdminSession,
  });
}

module.exports.path = path;
module.exports.handle = handle;
