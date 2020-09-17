"use strict";

const checkRun = require("../../lib/checkRun");
const notification = require("../../services/notification");
const task = require("../../lib/task");

/**
 * handle event
 * @param {*} body
 * @param {*} dependencies
 */
async function handle(body, dependencies) {
  // Parse the incoming body into the parts we care about
  const event = parseEvent(body);
  dependencies.logger.info("CheckRunEvent:");
  if (dependencies.serverConfig.logLevel === "verbose") {
    dependencies.logger.verbose(JSON.stringify(event, null, 2));
  }
  notification.repositoryEventReceived("check_run", event);

  // Ignore check_suite events not for this app
  if (event.appID !== parseInt(dependencies.serverConfig.githubAppID)) {
    return { status: "ignored, not our app id" };
  }

  await dependencies.db.storeRepository(event.owner, event.repo);

  if (event.action === "rerequested") {
    await requeueTask(event.externalID, dependencies);
  } else if (event.action === "requested_action") {
    for (let index = 0; index < event.pullRequests.length; index++) {
      await checkRun.createCheckRunForAction(
        event.owner,
        event.repo,
        event.sha,
        event.pullRequests[index],
        event.cloneURL,
        event.sshURL,
        event.actionID,
        event.externalID,
        dependencies.scm,
        dependencies.cache,
        dependencies.serverConfig,
        dependencies.db,
        dependencies.logger
      );
    }
  } else {
    dependencies.logger.verbose("ignoring check run, not a rerequested one");
    return { status: "check run ignored as it was not a rerequested check" };
  }
  return { status: "check runs created" };
}

async function requeueTask(taskID, dependencies) {
  const taskRows = await dependencies.db.fetchTask(taskID);
  if (taskRows == null) {
    return;
  }
  const existingTask = taskRows.rows[0];
  if (existingTask != null) {
    const detailsRows = await dependencies.db.fetchTaskDetails(taskID);
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
      build.repository,
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
  }
}

/**
 * parse body into an event object
 * @param {*} body
 * @return {object} event
 */
function parseEvent(body) {
  const fullName = body.repository.full_name;
  const parts = fullName.split("/");
  const owner = parts[0];
  const repo = parts[1];

  let actionID = null;
  if (body.requested_action != null) {
    actionID = body.requested_action.identifier;
  }

  return {
    appID: body.check_run.app.id,
    owner: owner,
    repo: repo,
    action: body.action,
    pullRequests:
      body.check_run.check_suite.pull_requests != null
        ? body.check_run.check_suite.pull_requests
        : [],
    sha: body.check_run.head_sha,
    cloneURL: body.repository.clone_url,
    sshURL: body.repository.ssh_url,
    checkRunID: body.check_run.id,
    externalID: body.check_run.external_id,
    actionID: actionID,
  };
}

module.exports.handle = handle;
