const Queue = require("bull");

/**
 * handle executeTaskSelection
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path, redisConfig, conf) {
  const owner = req.body.owner;
  const repository = req.body.repository;
  const taskDetails = await cache.fetchTaskConfig(req.body.task);

  const responseQueue = new Queue(
    "stampede-" + conf.responseQueue,
    redisConfig
  );

  const taskConfig = {};
  if (taskDetails.config != null) {
    for (let index = 0; index < taskDetails.config.length; index++) {
      taskConfig[taskDetails.config[index].key] =
        req.body[taskDetails.config[index].key];
    }
  } else {
    console.log("no task config!");
  }

  const scmConfig = {
    cloneURL: req.body["clone url"],
    sshURL: req.body["ssh url"]
  };
  if (req.body.buildType === "Pull Request") {
    scmConfig.pullRequest = {
      number: req.body["pr number"],
      title: req.body["pr title"],
      headRef: req.body["head ref"],
      headSha: req.body["head sha"],
      baseRef: req.body["base ref"],
      baseSha: req.body["base sha"]
    };
  } else if (req.body.buildType === "Branch") {
    scmConfig.branch = {
      name: req.body["branch name"],
      sha: req.body["branch sha"]
    };
  } else if (req.body.buildType === "Release") {
    scmConfig.release = {
      name: req.body["release name"],
      tag: req.body["release tag"],
      sha: req.body["release sha"]
    };
  }
  const execute = {
    owner: owner,
    repository: repository,
    buildType: req.body.buildType,
    task: taskDetails,
    taskConfig: taskConfig,
    scmConfig: scmConfig,
    taskQueue: req.body.taskQueue
  };

  responseQueue.add(
    { response: "executeTask", payload: execute },
    { removeOnComplete: true, removeOnFail: true }
  );

  responseQueue.close();

  res.render(path + "repositories/executeTask", {
    owner: req.body.owner,
    repository: req.body.repository
  });
}

module.exports.handle = handle;
