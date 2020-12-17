require("pkginfo")(module);

/**
 * path this handler will serve
 */
function path() {
  return "/help/taskHelp";
}

/**
 * if the route requires admin
 */
function requiresAdmin() {
  return false;
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const taskDetails = await dependencies.cache.fetchTaskConfig(
    req.query.taskID
  );
  const workerConfig = [];
  if (taskDetails.worker != null) {
    Object.keys(taskDetails.worker).forEach(function (key) {
      workerConfig.push({ key: key, value: taskDetails.worker[key] });
    });
  }

  let config = [];
  if (taskDetails.config != null) {
    for (let index = 0; index < taskDetails.config.length; index++) {
      if (
        taskDetails.config[index].adminParam == null ||
        taskDetails.config[index].adminParam == false
      ) {
        if (taskDetails.config[index].allowedValues != null) {
          const taskParam = taskDetails.config[index];
          taskParam.description =
            taskParam.description != null ? taskParam.description : "";
          taskParam.description +=
            "\nAllowed values: " + taskParam.allowedValues.join(",");
          config.push(taskParam);
        } else {
          config.push(taskDetails.config[index]);
        }
      }
    }
  }

  let example = "- id: " + req.query.taskID + "\n";
  if (taskDetails.config != null) {
    example += "  config:\n";
    for (let index = 0; index < taskDetails.config.length; index++) {
      if (
        taskDetails.config[index].adminParam == null ||
        taskDetails.config[index].adminParam == false
      ) {
        example +=
          "    - " + taskDetails.config[index].key + ": <value goes here>\n";
      }
    }
  }

  res.render(dependencies.viewsPath + "help/taskHelp", {
    owners: owners,
    isAdmin: req.validAdminSession,
    taskDetails: taskDetails,
    config: config,
    example: example,
  });
}

module.exports.path = path;
module.exports.handle = handle;
module.exports.requiresAdmin = requiresAdmin;
