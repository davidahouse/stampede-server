const task = require("../../lib/task");

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
  const existingTask = taskRows.rows[0];
  if (existingTask != null) {
    const detailsRows = await dependencies.db.fetchTaskDetails(
      req.query.taskID
    );
    const taskDetails = detailsRows.rows[0].details;
    const buildRows = await dependencies.db.fetchBuild(existingTask.build_id);
    const build = buildRows.rows[0];

    const buildTasks = await dependencies.db.fetchBuildTasks(
      existingTask.build_id
    );
    const taskNumber = buildTasks.rows.length + 1;
    const buildPath =
      build.owner + "-" + build.repository + "-" + build.build_key;

    let sha = "";
    if (taskDetails.scm.branch != null) {
      sha = taskDetails.scm.branch.sha;
    } else if (taskDetails.scm.release != null) {
      sha = taskDetails.scm.release.sha;
    } else if (taskDetails.scm.pullRequest != null) {
      sha = taskDetails.scm.pullRequest.head.sha;
    }

    const accessToken = await dependencies.scm.getAccessToken(
      build.owner,
      build.repo,
      dependencies.serverConfig
    );
    taskDetails.scm.accessToken = accessToken;

    const buildConfig = {
      config: {},
    };

    const repoConfig = {
      config: {},
    };

    const requeuedTask = {
      id: taskDetails.task.id,
      config: {},
    };

    Object.keys(taskDetails.config).forEach(function (key) {
      requeuedTask.config[key] = taskDetails.config[key].value;
    });

    task.startSingleTask(
      build.owner,
      build.repository,
      build.build_key,
      sha,
      requeuedTask,
      taskNumber,
      buildPath,
      build.build,
      dependencies.scm,
      taskDetails.scm,
      taskDetails.taskQueue,
      dependencies.cache,
      repoConfig,
      buildConfig,
      dependencies.serverConfig,
      dependencies.db,
      dependencies.logger
    );

    res.render(dependencies.viewsPath + "repositories/requeueTask", {
      owners: owners,
      isAdmin: req.validAdminSession,
      task: task,
      taskDetails: taskDetails,
      build: build,
    });
  } else {
    res.render(dependencies.viewsPath + "repositories/requeueTask", {
      owners: owners,
      isAdmin: req.validAdminSession,
      task: {},
      taskDetails: { details: {} },
      build: {},
    });
  }
}

module.exports.path = path;
module.exports.handle = handle;
