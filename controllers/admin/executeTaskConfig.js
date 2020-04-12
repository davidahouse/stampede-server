const yaml = require("js-yaml");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/executeTaskConfig";
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
  const scm = [];
  const config = [];
  let taskQueue = taskDetails.taskQueue;

  let providedScm = {};

  // If we were passed a file, use that instead of prompting the user
  if (req.files != null && req.files.uploadFile != null) {
    const uploadData = req.files.uploadFile;
    const uploadDetails = yaml.safeLoad(uploadData.data);
    const providedConfig =
      uploadDetails.config != null ? uploadDetails.config : {};
    Object.keys(providedConfig).forEach(function (key) {
      config.push({
        key: key,
        value: providedConfig[key] != null ? providedConfig[key] : "",
      });
    });

    providedScm = uploadDetails.scm != null ? uploadDetails.scm : {};
    if (uploadDetails.taskQueue != null) {
      taskQueue = uploadDetails.taskQueue;
    }
  } else {
    if (taskDetails.config != null) {
      for (let index = 0; index < taskDetails.config.length; index++) {
        config.push({ key: taskDetails.config[index].key, value: "" });
      }
    }
  }

  scm.push({
    key: "clone url",
    value: providedScm.cloneURL != null ? providedScm.cloneURL : "",
  });
  scm.push({
    key: "ssh url",
    value: providedScm.sshURL != null ? providedScm.sshURL : "",
  });
  if (req.body.buildType === "Pull Request") {
    scm.push({
      key: "pr number",
      value: providedScm.prNumber != null ? providedScm.prNumber : "",
    });
    scm.push({
      key: "head ref",
      value: providedScm.headRef != null ? providedScm.headRef : "",
    });
    scm.push({
      key: "head sha",
      value: providedScm.headSHA != null ? providedScm.headSHA : "",
    });
    scm.push({
      key: "base ref",
      value: providedScm.baseRef != null ? providedScm.baseRef : "",
    });
    scm.push({
      key: "base sha",
      value: providedScm.baseSHA != null ? providedScm.baseSHA : "",
    });
  } else if (req.body.buildType === "Branch") {
    scm.push({
      key: "branch name",
      value: providedScm.branchName != null ? providedScm.branchName : "",
    });
    scm.push({
      key: "branch sha",
      value: providedScm.branchSHA != null ? providedScm.branchSHA : "",
    });
  } else if (req.body.buildType === "Release") {
    scm.push({
      key: "release name",
      value: providedScm.releaseName != null ? providedScm.releaseName : "",
    });
    scm.push({
      key: "release tag",
      value: providedScm.releaseTag != null ? providedScm.releaseTag : "",
    });
  }

  res.render(dependencies.viewsPath + "admin/executeTaskConfig", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: owner,
    repository: repository,
    task: req.body.task,
    buildType: req.body.buildType,
    config: config,
    scm: scm,
    taskQueue: taskQueue,
  });
}

module.exports.path = path;
module.exports.method = method;
module.exports.handle = handle;
