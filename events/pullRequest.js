"use strict";

const checkRun = require("../lib/checkRun");
const notification = require("../lib/notification");
const config = require("../lib/config");
const build = require("../lib/build");

/**
 * handle event
 * @param {*} req
 * @param {*} serverConf
 * @param {*} cache
 */
async function handle(req, serverConf, cache, scm, db, logger) {
  // Parse the incoming body into the parts we care about
  const event = parseEvent(req);
  logger.info("PullRequestEvent:");
  if (serverConf.logLevel === "verbose") {
    logger.verbose(JSON.stringify(event, null, 2));
  }
  notification.repositoryEventReceived("pull_request", event);

  await db.storeRepository(event.owner, event.repo);

  if (
    event.action === "opened" ||
    event.action === "reopened" ||
    event.action === "synchronize"
  ) {
    await checkRun.createCheckRun(
      event.owner,
      event.repo,
      event.sha,
      event.pullRequest,
      event.cloneURL,
      event.sshURL,
      scm,
      cache,
      serverConf,
      db,
      logger
    );
    return { status: "pull request tasks created" };
  } else if (event.action === "edited") {
    await pullRequestEdit(
      event.owner,
      event.repo,
      event.sha,
      event.pullRequest,
      event.cloneURL,
      event.sshURL,
      scm,
      cache,
      serverConf,
      db,
      logger
    );
  } else {
    return { status: "ignored, pull request not opened or reopened" };
  }
}

/**
 * parse body into an event object
 * @param {*} req
 * @return {object} event
 */
function parseEvent(req) {
  const fullName = req.body.repository.full_name;
  const parts = fullName.split("/");
  const owner = parts[0];
  const repo = parts[1];
  return {
    owner: owner,
    repo: repo,
    action: req.body.action,
    pullRequest: req.body.pull_request,
    sha: req.body.pull_request.head.sha,
    cloneURL:
      req.body.pull_request.head.repo.clone_url != null
        ? req.body.pull_request.head.repo.clone_url
        : req.body.repository.clone_url,
    sshURL:
      req.body.pull_request.head.repo.ssh_url != null
        ? req.body.pull_request.head.repo.ssh_url
        : req.body.repository.ssh_url,
  };
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
async function pullRequestEdit(
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
    repoConfig.pullrequestedit == null ||
    repoConfig.pullrequestedit.tasks == null
  ) {
    logger.verbose("Unable to find tasks. Unable to continue.");
    return;
  }

  if (repoConfig.pullrequestedit.tasks.length === 0) {
    logger.verbose("Task list was empty. Unable to continue.");
    return;
  }

  const pullRequestDetails = {
    number: pullRequest.number,
    head: {
      ref: pullRequest.head.ref,
      sha: pullRequest.head.sha,
    },
    base: {
      ref: pullRequest.base.ref,
      sha: pullRequest.base.sha,
    },
  };

  const buildDetails = {
    owner: owner,
    repo: repo,
    sha: sha,
    pullRequest: pullRequestDetails,
    buildKey: "pullrequest-" + pullRequest.number,
  };

  const scmDetails = {
    id: serverConf.scm,
    cloneURL: cloneURL,
    sshURL: sshURL,
    pullRequest: pullRequestDetails,
  };

  build.startBuild(
    buildDetails,
    scm,
    scmDetails,
    repoConfig,
    repoConfig.pullrequestedit,
    repoConfig.pullrequestedit.tasks,
    [],
    cache,
    serverConf,
    db,
    logger,
    "pull-request"
  );
}

module.exports.handle = handle;
