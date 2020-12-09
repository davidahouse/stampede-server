"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/repository/taskDetails";
}

/**
 * handle buildKeys
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const taskID = req.query.taskID;
  const taskRows = await dependencies.db.fetchTask(taskID);
  const task = taskRows.rows[0];

  const detailsRows = await dependencies.db.fetchTaskDetails(req.query.taskID);
  let taskDetails = { details: {} };
  let configValues = [];
  let scmDetails = [];
  let summary = "";
  let text = "";
  let artifacts = [];
  if (detailsRows.rows.length > 0) {
    taskDetails = detailsRows.rows[0];
    if (req.validAdminSession == true) {
      Object.keys(
        taskDetails.details.config != null ? taskDetails.details.config : {}
      ).forEach(function (key) {
        configValues.push({
          key: key,
          value: taskDetails.details.config[key].value,
          source: taskDetails.details.config[key].source,
        });
      });
    }
    summary =
      taskDetails.details.result != null &&
      taskDetails.details.result.summary != null
        ? taskDetails.details.result.summary
        : "";
    text =
      taskDetails.details.result != null &&
      taskDetails.details.result.text != null
        ? taskDetails.details.result.text
        : "";
    artifacts =
      taskDetails.details.result != null &&
      taskDetails.details.result.artifacts != null
        ? taskDetails.details.result.artifacts
        : [];

    if (taskDetails.details.scm.pullRequest != null) {
      scmDetails.push({
        title: "PR Number",
        value: taskDetails.details.scm.pullRequest.number.toString(),
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
        value: taskDetails.details.scm.release.name.toString(),
      });
      scmDetails.push({
        title: "Tag",
        value: taskDetails.details.scm.release.tag.toString(),
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
      if (artifact.type == "cloc") {
        artifact.url =
          "/artifacts/viewCloc?taskID=" +
          task.task_id +
          "&artifact=" +
          encodeURI(artifact.title);
      } else if (artifact.type == "xcodebuild") {
        artifact.url =
          "/artifacts/viewXcodebuild?taskID=" +
          task.task_id +
          "&artifact=" +
          encodeURI(artifact.title);
      } else if (artifact.type == "imagegallery") {
        artifact.url =
          "/artifacts/viewImageGallery?taskID=" +
          task.task_id +
          "&artifact=" +
          encodeURI(artifact.title);
      } else if (artifact.type == "imagediff") {
        artifact.url =
          "/artifacts/viewImageGalleryDiff?taskID=" +
          task.task_id +
          "&artifact=" +
          encodeURI(artifact.title);
      } else if (artifact.type == "download") {
      } else if (artifact.type == "link") {
      } else if (artifact.type == "installplist") {
        artifact.url =
          "itms-services://?action=download-manifest&url=" +
          encodeURI(artifact.url);
      } else {
        artifact.url =
          "/artifacts/viewUnknown?taskID=" +
          task.task_id +
          "&artifact=" +
          encodeURI(artifact.title);
      }

      artifacts.push(artifact);
    }
  }
  res.send({
    task: task,
    configValues: configValues,
    summary: summary,
    text: text,
    artifacts: artifacts,
    scmDetails: scmDetails,
  });
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "repository-taskDetails",
      parameters: [
        {
          in: "query",
          name: "taskID",
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "",
        },
      },
    },
  };
}

module.exports.path = path;
module.exports.handle = handle;
module.exports.docs = docs;
