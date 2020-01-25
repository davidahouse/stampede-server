"use strict";

const chalk = require("chalk");

const config = require("../lib/config");
const build = require("../lib/build");
const notification = require("../lib/notification");

/**
 * handle event
 * @param {*} req
 * @param {*} serverConf
 * @param {*} cache
 */
async function handle(req, serverConf, cache, scm, db) {
  // Parse the incoming body into the parts we care about
  const event = parseEvent(req);
  console.log("--- PushEvent:");
  console.dir(event);
  notification.repositoryEventReceived("push", event);

  if (event.created === true || event.deleted === true) {
    console.log("--- Ignoring push since it is created or deleted");
    return { status: "ignoring due to created or pushed" };
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
    console.log(
      chalk.red(
        "--- Unable to determine config, no found in Redis or the project. Unable to continue"
      )
    );
    return { status: "no repo config found" };
  }

  if (repoConfig.branches == null) {
    console.log(
      chalk.red("--- No branch builds configured, unable to continue.")
    );
    return { status: "no branches configured" };
  }

  console.dir(repoConfig.branches);
  const branchConfig = repoConfig.branches[event.branch];
  if (branchConfig == null) {
    console.log(
      chalk.red(
        "--- No branch config for this branch: " + event.branch + ", skipping"
      )
    );
    return { status: "branch not configured" };
  }

  if (branchConfig.tasks.length === 0) {
    console.log(chalk.red("--- Task list was empty. Unable to continue."));
    return { status: "no tasks configured for the branch" };
  }

  const buildDetails = {
    owner: event.owner,
    repo: event.repo,
    sha: event.sha,
    branch: event.branch,
    buildKey: event.branch
  };

  const scmDetails = {
    id: serverConf.scm,
    cloneURL: event.cloneURL,
    sshURL: event.sshURL,
    branch: {
      name: event.branch,
      sha: event.sha
    }
  };

  build.startBuild(
    buildDetails,
    scm,
    scmDetails,
    repoConfig,
    branchConfig,
    branchConfig.tasks,
    cache,
    serverConf,
    db
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
  const ref = req.body.ref.split("/");
  return {
    owner: owner,
    repo: repo,
    created: req.body.created,
    deleted: req.body.deleted,
    branch: ref[ref.length - 1],
    sha: req.body.after,
    cloneURL: req.body.repository.clone_url,
    sshURL: req.body.repository.ssh_url
  };
}

module.exports.handle = handle;
