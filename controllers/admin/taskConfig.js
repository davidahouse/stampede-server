/**
 * path this handler will serve
 */
function path() {
  return "/admin/taskConfig";
}

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const taskDetails = await dependencies.cache.fetchTaskConfig(
    req.query.taskID
  );
  console.dir(taskDetails);
  const workerConfig = [];
  if (taskDetails.worker != null) {
    Object.keys(taskDetails.worker).forEach(function(key) {
      workerConfig.push({ key: key, value: taskDetails.worker[key] });
    });
  }

  let example = "- id: " + req.query.taskID + "\n";
  if (taskDetails.config != null) {
    example += "  config:\n";
    for (let index = 0; index < taskDetails.config.length; index++) {
      example +=
        "    - " + taskDetails.config[index].key + ": <value goes here>\n";
    }
  }

  res.render(dependencies.viewsPath + "admin/taskConfig", {
    taskID: req.query.taskID,
    taskDetails: taskDetails,
    config: taskDetails.config != null ? taskDetails.config : [],
    workerConfig: workerConfig,
    example: example
  });
}

module.exports.path = path;
module.exports.handle = handle;
