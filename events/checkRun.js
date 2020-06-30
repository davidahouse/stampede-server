"use strict";

const checkRun = require("../lib/checkRun");
const notification = require("../lib/notification");

/**
 * handle event
 * @param {*} body
 * @param {*} serverConf
 * @param {*} cache
 */
async function handle(body, serverConf, cache, scm, db, logger) {
  // Parse the incoming body into the parts we care about
  const event = parseEvent(body);
  logger.info("CheckRunEvent:");
  if (serverConf.logLevel === "verbose") {
    logger.verbose(JSON.stringify(event, null, 2));
  }
  notification.repositoryEventReceived("check_run", event);

  // Ignore check_suite events not for this app
  if (event.appID !== parseInt(serverConf.githubAppID)) {
    return { status: "ignored, not our app id" };
  }

  await db.storeRepository(event.owner, event.repo);

  if (event.action === "rerequested") {
    for (let index = 0; index < event.pullRequests.length; index++) {
      await checkRun.createCheckRun(
        event.owner,
        event.repo,
        event.sha,
        event.pullRequests[index],
        event.cloneURL,
        event.sshURL,
        scm,
        cache,
        serverConf,
        db,
        logger
      );
    }
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
        scm,
        cache,
        serverConf,
        db,
        logger
      );
    }
  } else {
    logger.verbose("ignoring check run, not a rerequested one");
    return { status: "check run ignored as it was not a rerequested check" };
  }
  return { status: "check runs created" };
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
