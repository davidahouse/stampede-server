const taskDetail = require("../../lib/taskDetail");

/**
 * path this handler will serve
 */
function path() {
  return "/monitor/buildTaskDetails";
}

/**
 * handle taskDetails
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
    const taskDetails = detailsRows.rows[0];
    const taskConfig = await dependencies.cache.fetchTaskConfig(task.task);
    const configValues = await taskDetail.taskConfigValues(
      taskDetails,
      taskConfig,
      req.validAdminSession
    );
    const buildRows = await dependencies.db.fetchBuild(task.build_id);
    const build = buildRows.rows[0];
    const summary =
      taskDetails.details.result != null &&
      taskDetails.details.result.summary != null
        ? taskDetails.details.result.summary
        : "";
    const text =
      taskDetails.details.result != null &&
      taskDetails.details.result.text != null
        ? taskDetails.details.result.text
        : "";
    const artifacts =
      taskDetails.details.result != null &&
      taskDetails.details.result.artifacts != null
        ? taskDetails.details.result.artifacts
        : [];
    const summaryTable =
      taskDetails.details.result != null &&
      taskDetails.details.result.summaryTable != null
        ? taskDetails.details.result.summaryTable
        : [];

    const scmDetails = [];
    if (taskDetails.details.scm.pullRequest != null) {
      scmDetails.push({
        title: "PR Number",
        value: taskDetails.details.scm.pullRequest.number,
      });
      scmDetails.push({
        title: "Head",
        value: taskDetails.details.scm.pullRequest.head.ref,
      });
      scmDetails.push({
        title: "Head SHA",
        value: taskDetails.details.scm.pullRequest.head.sha,
      });
      scmDetails.push({
        title: "Base",
        value: taskDetails.details.scm.pullRequest.base.ref,
      });
      scmDetails.push({
        title: "Base SHA",
        value: taskDetails.details.scm.pullRequest.base.sha,
      });
    } else if (taskDetails.details.scm.branch != null) {
      scmDetails.push({
        title: "Branch",
        value: taskDetails.details.scm.branch.name,
      }),
        scmDetails.push({
          title: "SHA",
          value: taskDetails.details.scm.branch.sha,
        });
      scmDetails.push({
        title: "Commit",
        value: taskDetails.details.scm.commitMessage,
      });
    } else if (taskDetails.details.scm.release != null) {
      scmDetails.push({
        title: "Release",
        value: taskDetails.details.scm.release.name,
      });
      scmDetails.push({
        title: "Tag",
        value: taskDetails.details.scm.release.tag,
      });
      scmDetails.push({
        title: "SHA",
        value: taskDetails.details.scm.release.sha,
      });
    }

    const artifactRows = await dependencies.db.fetchTaskArtifacts(
      req.query.taskID
    );
    if (artifactRows != null && artifactRows.rows != null) {
      for (let aindex = 0; aindex < artifactRows.rows.length; aindex++) {
        artifacts.push(artifactRows.rows[aindex]);
      }
    }

    res.render(dependencies.viewsPath + "monitor/buildTaskDetails", {
      owners: owners,
      isAdmin: req.validAdminSession,
      task: task,
      build: build,
      taskDetails: taskDetails,
      configValues: configValues,
      summary: summary,
      summaryTable: summaryTable,
      text: text,
      artifacts: artifacts,
      scmDetails: scmDetails,
    });
  } else {
    res.render(dependencies.viewsPath + "monitor/buildTaskDetails", {
      owners: owners,
      isAdmin: req.validAdminSession,
      task: {},
      build: {},
      taskDetails: { details: {} },
      configValues: [],
      summary: "",
      summaryTable: summaryTable,
      text: "",
      artifacts: [],
      scmDetails: scmDetails,
    });
  }
}

module.exports.path = path;
module.exports.handle = handle;
