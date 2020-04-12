const taskExecute = require("../../lib/taskExecute");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/executeTask";
}

/**
 * http method this handler will serve
 */
function method() {
  return "post";
}

/**
 * handle executeTaskSelection
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const owner = req.body.owner;
  const repository = req.body.repository;
  const taskDetails = await dependencies.cache.fetchTaskConfig(req.body.task);

  const taskConfig = {};
  if (taskDetails.config != null) {
    for (let index = 0; index < taskDetails.config.length; index++) {
      taskConfig[taskDetails.config[index].key] =
        req.body[taskDetails.config[index].key];
    }
  }

  const scmConfig = {
    cloneURL: req.body["clone url"],
    sshURL: req.body["ssh url"],
  };
  if (req.body.buildType === "Pull Request") {
    scmConfig.pullRequest = {
      number: req.body["pr number"],
      head: {
        ref: req.body["head ref"],
        sha: req.body["head sha"],
      },
      base: {
        ref: req.body["base ref"],
        sha: req.body["base sha"],
      },
    };
  } else if (req.body.buildType === "Branch") {
    scmConfig.branch = {
      name: req.body["branch name"],
      sha: req.body["branch sha"],
    };
  } else if (req.body.buildType === "Release") {
    scmConfig.release = {
      name: req.body["release name"],
      tag: req.body["release tag"],
      sha: req.body["release sha"],
    };
  }
  const execute = {
    owner: owner,
    repository: repository,
    buildType: req.body.buildType,
    task: taskDetails,
    taskConfig: taskConfig,
    scmConfig: scmConfig,
    taskQueue: req.body.taskQueue,
  };

  taskExecute.handle(
    execute,
    dependencies.serverConfig,
    dependencies.cache,
    dependencies.scm,
    dependencies.db,
    dependencies.logger
  );

  res.render(dependencies.viewsPath + "admin/executeTask", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: req.body.owner,
    repository: req.body.repository,
  });
}

module.exports.path = path;
module.exports.method = method;
module.exports.handle = handle;
