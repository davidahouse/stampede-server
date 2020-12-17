require("pkginfo")(module);

/**
 * path this handler will serve
 */
function path() {
  return "/help/guideConfigureRepository";
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
  let fileFormatOverview = "config:\n";
  fileFormatOverview +=
    "  # This section contains default values for parameters used by\n";
  fileFormatOverview += "  # tasks in the rest of the file.\n";
  fileFormatOverview +=
    "  # An example is here below, but be sure to use the real parameter\n";
  fileFormatOverview +=
    "  # name, based on the tasks that you have added to your file below\n";
  fileFormatOverview += "  parameter: value\n";
  fileFormatOverview += "\n";
  fileFormatOverview += "pullrequests:\n";
  fileFormatOverview += "  tasks:\n";
  fileFormatOverview +=
    "    # add any tasks you want to execute for your pull requests here.\n";
  fileFormatOverview +=
    "    # An example is provided here of a task, but the actual tasks available\n";
  fileFormatOverview +=
    "    # are setup by your admin, so check out the Help | Tasks section to learn more.\n";
  fileFormatOverview +=
    "    # You can include many tasks here, even ones with the same id.\n";
  fileFormatOverview +=
    "    # Also note that each task will have it's own set of parameters that have been defined\n";
  fileFormatOverview +=
    "    # by the system admin. These are described in the Help | Tasks section as well.\n";
  fileFormatOverview += "    - id: my-task\n";
  fileFormatOverview += "      config:\n";
  fileFormatOverview += "        parameter: value\n";
  fileFormatOverview += "    - id: another-task\n";
  fileFormatOverview += "      config:\n";
  fileFormatOverview += "        parameter: value\n";
  fileFormatOverview += "\n";
  fileFormatOverview += "branches:\n";
  fileFormatOverview +=
    "  # This section can contain as many branch names as you want. Each branch\n";
  fileFormatOverview +=
    "  # can have a different set of tasks. For this example, we will use the main branch:\n";
  fileFormatOverview += "  main:\n";
  fileFormatOverview += "    tasks:\n";
  fileFormatOverview += "    - id: a-task\n";
  fileFormatOverview += "      config:\n";
  fileFormatOverview += "        parameter: value\n";
  fileFormatOverview += "\n";
  fileFormatOverview += "releases:\n";
  fileFormatOverview += "  published:\n";
  fileFormatOverview +=
    "    # This section will determine which tasks are executed when you create a GitHub\n";
  fileFormatOverview +=
    "    # release and publish it. At this time, publishing is the only time when release tasks\n";
  fileFormatOverview +=
    "    # are executed. Similar to pull requests and branches, you can have many tasks defined\n";
  fileFormatOverview += "    # here to run\n";
  fileFormatOverview += "    tasks:\n";
  fileFormatOverview += "      - id: a-task\n";
  fileFormatOverview += "        config:\n";
  fileFormatOverview += "          parameter: value\n";

  res.render(dependencies.viewsPath + "help/guideConfigureRepository", {
    owners: owners,
    isAdmin: req.validAdminSession,
    fileFormatOverview: fileFormatOverview,
  });
}

module.exports.path = path;
module.exports.handle = handle;
module.exports.requiresAdmin = requiresAdmin;
