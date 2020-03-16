"use strict";

const build = require("./build");
const config = require("./config");
const task = require("./task");

/**
 * Create a check run
 * @param {*} owner
 * @param {*} repo
 * @param {*} sha
 * @param {*} pullRequest
 * @param {*} cloneURL
 * @param {*} sshURL
 * @param {*} scm
 * @param {*} cache
 * @param {*} serverConf
 * @param {*} db
 * @param {*} logger
 */
async function createCheckRun(
  owner,
  repo,
  sha,
  pullRequest,
  cloneURL,
  sshURL,
  scm,
  cache,
  serverConf,
  db,
  logger
) {
  logger.verbose(
    "Creating check run for " + owner + " " + repo + " PR " + pullRequest.number
  );

  const repoConfig = await config.findRepoConfig(
    owner,
    repo,
    sha,
    serverConf.stampedeFileName,
    scm,
    cache,
    serverConf
  );
  logger.verbose(JSON.stringify(repoConfig, null, 2));
  if (repoConfig == null) {
    logger.verbose(
      "Unable to determine config, no found in Redis or the project. Unable to continue"
    );
    return;
  }

  if (
    repoConfig.pullrequests == null ||
    repoConfig.pullrequests.tasks == null
  ) {
    await scm.createStampedeCheck(owner, repo, sha, null, [], serverConf);
    logger.verbose("Unable to find tasks. Unable to continue.");
    return;
  }

  if (repoConfig.pullrequests.tasks.length === 0) {
    await scm.createStampedeCheck(owner, repo, sha, null, [], serverConf);
    logger.verbose("Task list was empty. Unable to continue.");
    return;
  }

  const pullRequestDetails = {
    number: pullRequest.number,
    head: {
      ref: pullRequest.head.ref,
      sha: sha
    },
    base: {
      ref: pullRequest.base.ref,
      sha: pullRequest.base.sha
    }
  };

  const buildDetails = {
    owner: owner,
    repo: repo,
    sha: sha,
    pullRequest: pullRequestDetails,
    buildKey: "pullrequest-" + pullRequest.number
  };

  const scmDetails = {
    id: serverConf.scm,
    cloneURL: cloneURL,
    sshURL: sshURL,
    pullRequest: pullRequestDetails
  };

  build.startBuild(
    buildDetails,
    scm,
    scmDetails,
    repoConfig,
    repoConfig.pullrequests,
    repoConfig.pullrequests.tasks,
    repoConfig.pullrequests.actions != null
      ? repoConfig.pullrequests.actions
      : [],
    cache,
    serverConf,
    db,
    logger
  );
}

/**
 * Create a check run
 * @param {*} owner
 * @param {*} repo
 * @param {*} sha
 * @param {*} pullRequest
 * @param {*} cloneURL
 * @param {*} sshURL
 * @param {*} scm
 * @param {*} cache
 * @param {*} serverConf
 * @param {*} db
 * @param {*} logger
 */
async function createCheckRunForAction(
  owner,
  repo,
  sha,
  pullRequest,
  cloneURL,
  sshURL,
  actionID,
  externalID,
  scm,
  cache,
  serverConf,
  db,
  logger
) {
  logger.verbose(
    "Creating check run for " +
      owner +
      " " +
      repo +
      " PR " +
      pullRequest.number +
      " Action " +
      actionID
  );

  const repoConfig = await config.findRepoConfig(
    owner,
    repo,
    sha,
    serverConf.stampedeFileName,
    scm,
    cache,
    serverConf
  );
  if (repoConfig == null) {
    logger.verbose(
      "Unable to determine config, no found in Redis or the project. Unable to continue"
    );
    return;
  }

  if (
    repoConfig.pullrequests == null ||
    repoConfig.pullrequests.actions == null
  ) {
    logger.verbose("Unable to find actions. Unable to continue.");
    return;
  }

  if (repoConfig.pullrequests.actions.length === 0) {
    logger.verbose("Actions list was empty. Unable to continue.");
    return;
  }

  const actionIndex = parseInt(actionID);
  const action = repoConfig.pullrequests.actions[actionIndex];
  const externalIDParts = externalID.split("-");
  const buildNumber = externalIDParts[externalIDParts.length - 1];

  const pullRequestDetails = {
    number: pullRequest.number,
    head: {
      ref: pullRequest.head.ref,
      sha: sha
    },
    base: {
      ref: pullRequest.base.ref,
      sha: pullRequest.base.sha
    }
  };

  const buildDetails = {
    owner: owner,
    repo: repo,
    sha: sha,
    pullRequest: pullRequestDetails,
    buildKey: "pullrequest-" + pullRequest.number
  };

  const scmDetails = {
    id: serverConf.scm,
    cloneURL: cloneURL,
    sshURL: sshURL,
    pullRequest: pullRequestDetails
  };

  const buildPath =
    buildDetails.owner + "-" + buildDetails.repo + "-" + buildDetails.buildKey;
  const buildConfig = repoConfig.pullrequests;

  task.startTasks(
    buildDetails.owner,
    buildDetails.repo,
    buildDetails.buildKey,
    buildDetails.sha,
    [action],
    buildPath,
    buildNumber,
    scm,
    scmDetails,
    buildDetails.overrideTaskQueue,
    cache,
    repoConfig,
    buildConfig,
    serverConf,
    db,
    logger
  );
}

module.exports.createCheckRun = createCheckRun;
module.exports.createCheckRunForAction = createCheckRunForAction;
