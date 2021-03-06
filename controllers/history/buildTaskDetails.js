const prettyMilliseconds = require("pretty-ms");
const taskDetail = require("../../lib/taskDetail");

/**
 * path this handler will serve
 */
function path() {
  return "/history/buildTaskDetails";
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
    let configValues = [];
    const scmDetails = [];
    let artifacts = [];
    let taskDetails = { details: {} };
    if (detailsRows.rows.length > 0) {
      taskDetails = detailsRows.rows[0];
      const taskConfig = await dependencies.cache.fetchTaskConfig(task.task);
      configValues = await taskDetail.taskConfigValues(
        taskDetails,
        taskConfig,
        req.validAdminSession
      );
      artifacts =
        taskDetails.details.result != null &&
        taskDetails.details.result.artifacts != null
          ? taskDetails.details.result.artifacts
          : [];

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
    }
    const artifactRows = await dependencies.db.fetchTaskArtifacts(
      req.query.taskID
    );
    if (artifactRows != null && artifactRows.rows != null) {
      for (let aindex = 0; aindex < artifactRows.rows.length; aindex++) {
        const artifact = artifactRows.rows[aindex];
        if (artifact.type == "installplist") {
          artifact.url =
            "itms-services://?action=download-manifest&url=" +
            encodeURIComponent(artifact.url);
        }
        artifacts.push(artifact);
      }
    }

    const buildRows = await dependencies.db.fetchBuild(task.build_id);
    const build = buildRows.rows[0];

    res.render(dependencies.viewsPath + "history/buildTaskDetails", {
      owners: owners,
      isAdmin: req.validAdminSession,
      task: task,
      build: build,
      taskDetails: taskDetails,
      configValues: configValues,
      artifacts: artifacts,
      scmDetails: scmDetails,
      prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
    });
  } else {
    res.render(dependencies.viewsPath + "history/buildTaskDetails", {
      owners: owners,
      isAdmin: req.validAdminSession,
      task: {},
      build: {},
      taskDetails: { details: {} },
      configValues: {},
      artifacts: [],
      scmDetails: [],
      prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
    });
  }
}

module.exports.path = path;
module.exports.handle = handle;
