"use strict";

const sanitize = require("sanitize-filename");

const config = require("../../lib/config");
const build = require("../../lib/build");
const notification = require("../../services/notification");

/**
 * handle event
 * @param {*} body
 * @param {*} eventID
 * @param {*} dependencies
 */
async function handle(body, eventID, dependencies) {
  // Parse the incoming body into the parts we care about
  const event = parseEvent(body);
  dependencies.logger.info("PushEvent:");
  notification.repositoryEventReceived("push", event);

  dependencies.cache.storeRepoEvent(event.owner, event.repo, {
    source: "branch-push",
    timestamp: new Date(),
    eventID: eventID,
    body: body,
  });
  await dependencies.db.storeRepository(event.owner, event.repo);

  if (event.deleted === true) {
    dependencies.logger.verbose(
      "Ignoring push since it is for a deleted branch"
    );
    return { status: "ignoring due to deleted branch" };
  }

  const repoConfig = await config.findRepoConfig(
    event.owner,
    event.repo,
    event.sha,
    dependencies.serverConfig.stampedeFileName,
    dependencies.scm,
    dependencies.cache,
    dependencies.serverConfig
  );
  if (repoConfig == null) {
    dependencies.logger.verbose(
      "Unable to determine config, no found in Redis or the project. Unable to continue"
    );
    return { status: "no repo config found" };
  }

  if (repoConfig.branches == null) {
    dependencies.logger.verbose(
      "No branch builds configured, unable to continue."
    );
    return { status: "no branches configured" };
  }

  const branchConfig = repoConfig.branches[event.branch];
  if (branchConfig == null) {
    dependencies.logger.verbose(
      "No branch config for this branch: " + event.branch + ", skipping"
    );
    return { status: "branch not configured" };
  }

  if (branchConfig.tasks == null || branchConfig.tasks.length === 0) {
    dependencies.logger.verbose("Task list was empty. Unable to continue.");
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
    id: dependencies.serverConfig.scm,
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
    dependencies.scm,
    scmDetails,
    repoConfig,
    branchConfig,
    branchConfig.tasks,
    [],
    dependencies.cache,
    dependencies.serverConfig,
    dependencies.db,
    dependencies.logger,
    "branch-push"
  );
  return { status: "branch tasks created" };
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
  return {
    owner: owner,
    repo: repo,
    created: body.created,
    deleted: body.deleted,
    branch: body.ref.replace("refs/heads/", ""),
    sha: body.after,
    cloneURL: body.repository.clone_url,
    sshURL: body.repository.ssh_url,
    commitMessage:
      body.head_commit != null && body.head_commit.message != null
        ? body.head_commit.message
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
