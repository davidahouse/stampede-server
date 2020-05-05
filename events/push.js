"use strict";

const sanitize = require("sanitize-filename");

const config = require("../lib/config");
const build = require("../lib/build");
const notification = require("../lib/notification");

/**
 * handle event
 * @param {*} req
 * @param {*} serverConf
 * @param {*} cache
 */
async function handle(req, serverConf, cache, scm, db, logger) {
  // Parse the incoming body into the parts we care about
  const event = parseEvent(req);
  logger.info("PushEvent:");
  notification.repositoryEventReceived("push", event);

  await db.storeRepository(event.owner, event.repo);

  if (event.deleted === true) {
    logger.verbose("Ignoring push since it is for a deleted branch");
    return { status: "ignoring due to deleted branch" };
  }

  const repoConfig = await config.findRepoConfig(
    event.owner,
    event.repo,
    event.sha,
    serverConf.stampedeFileName,
    scm,
    cache,
    serverConf
  );
  if (repoConfig == null) {
    logger.verbose(
      "Unable to determine config, no found in Redis or the project. Unable to continue"
    );
    return { status: "no repo config found" };
  }

  if (repoConfig.branches == null) {
    logger.verbose("No branch builds configured, unable to continue.");
    return { status: "no branches configured" };
  }

  const branchConfig = repoConfig.branches[event.branch];
  if (branchConfig == null) {
    logger.verbose(
      "No branch config for this branch: " + event.branch + ", skipping"
    );
    return { status: "branch not configured" };
  }

  if (branchConfig.tasks.length === 0) {
    logger.verbose("Task list was empty. Unable to continue.");
    return { status: "no tasks configured for the branch" };
  }

  const buildDetails = {
    owner: event.owner,
    repo: event.repo,
    sha: event.sha,
    branch: event.branch,
    buildKey: safeBuildKey(event.branch),
  };

  const scmDetails = {
    id: serverConf.scm,
    cloneURL: event.cloneURL,
    sshURL: event.sshURL,
    branch: {
      name: event.branch,
      sha: event.sha,
    },
    commitMessage: event.commitMessage,
  };

  build.startBuild(
    buildDetails,
    scm,
    scmDetails,
    repoConfig,
    branchConfig,
    branchConfig.tasks,
    [],
    cache,
    serverConf,
    db,
    logger
  );
  return { status: "branch tasks created" };
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
    created: req.body.created,
    deleted: req.body.deleted,
    branch: req.body.ref.replace("refs/heads/", ""),
    sha: req.body.after,
    cloneURL: req.body.repository.clone_url,
    sshURL: req.body.repository.ssh_url,
    commitMessage:
      req.body.head_commit != null && req.body.head_commit.message != null
        ? req.body.head_commit.message
        : "",
  };
}

/**
 * safeBuildKey
 * Create a safe build key, replacing any characters that would be
 * unsafe to use when creating the working folder
 * @param {*} branch
 */
function safeBuildKey(branch) {
  const spacesRemoved = branch.replace(/ /g, "_");
  return sanitize(spacesRemoved);
}

module.exports.handle = handle;
