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
    await dependencies.cache.removeTaskFromActiveList(
      buildID,
      remainingTasks[index]
    );
    try {
      await dependencies.db.storeTaskCompleted(
        remainingTasks[index],
        "cancelled",
        new Date(),
        new Date(),
        "cancelled"
      );
    } catch (e) {
      logger.error("Error storing task completed details: " + e);
    }
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
