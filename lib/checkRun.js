"use strict";

const chalk = require("chalk");

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
  db
) {
  console.log(
    chalk.green(
      "--- Creating check run for " +
        owner +
        " " +
        repo +
        " PR " +
        pullRequest.number
    )
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
  console.dir(repoConfig);
  if (repoConfig == null) {
    console.log(
      chalk.red(
        "--- Unable to determine config, no found in Redis or the project. Unable to continue"
      )
    );
    return;
  }

  if (
    repoConfig.pullrequests == null ||
    repoConfig.pullrequests.tasks == null
  ) {
    await scm.createStampedeCheck(owner, repo, sha, null, [], serverConf);
    console.log(chalk.red("--- Unable to find tasks. Unable to continue."));
    return;
  }

  console.dir(repoConfig.pullrequests);
  console.dir(repoConfig.pullrequests.tasks);
  if (repoConfig.pullrequests.tasks.length === 0) {
    await scm.createStampedeCheck(owner, repo, sha, null, [], serverConf);
    console.log(chalk.red("--- Task list was empty. Unable to continue."));
    return;
  }

  const pullRequestDetails = {
    number: pullRequest.number,
    title: pullRequest.title,
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
    db
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
  db
) {
  console.log(
    chalk.green(
      "--- Creating check run for " +
        owner +
        " " +
        repo +
        " PR " +
        pullRequest.number +
        " Action " +
        actionID
    )
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
  console.dir(repoConfig);
  if (repoConfig == null) {
    console.log(
      chalk.red(
        "--- Unable to determine config, no found in Redis or the project. Unable to continue"
      )
    );
    return;
  }

  if (
    repoConfig.pullrequests == null ||
    repoConfig.pullrequests.actions == null
  ) {
    console.log(chalk.red("--- Unable to find actions. Unable to continue."));
    return;
  }

  console.dir(repoConfig.pullrequests);
  console.dir(repoConfig.pullrequests.actions);
  if (repoConfig.pullrequests.actions.length === 0) {
    console.log(chalk.red("--- Actions list was empty. Unable to continue."));
    return;
  }

  const actionIndex = parseInt(actionID);
  const action = repoConfig.pullrequests.actions[actionIndex];
  const externalIDParts = externalID.split("-");
  const buildNumber = externalIDParts[externalIDParts.length - 1];

  const pullRequestDetails = {
    number: pullRequest.number,
    title: pullRequest.title,
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
    db
  );
}

module.exports.createCheckRun = createCheckRun;
module.exports.createCheckRunForAction = createCheckRunForAction;
