"use strict";

const sanitize = require("sanitize-filename");

const config = require("../../lib/config");
const build = require("../../lib/build");
const notification = require("../../services/notification");

/**
 * handle event
 * @param {*} req
 * @param {*} dependencies
 */
async function handle(body, dependencies) {
  // Parse the incoming body into the parts we care about
  const event = parseEvent(body);
  dependencies.logger.info("ReleaseEvent:");
  notification.repositoryEventReceived("release", event);

  await dependencies.db.storeRepository(event.owner, event.repo);

  if (event.action !== "published") {
    dependencies.logger.verbose(
      "Ignoring as the release is not marked as published"
    );
    return { status: "not a published release, ignoring" };
  }

  // Find the sha for this release based on the tag unless this is a draft PR. In that
  // case, we need to just try and find the sha from the target branch
  let ref = "";
  if (event.draft === true) {
    dependencies.logger.verbose(
      "Trying to find head sha for branch " + event.target
    );
    ref = "heads/" + event.target;
  } else {
    dependencies.logger.verbose("Trying to find sha for " + event.tag);
    ref = "tags/" + event.tag;
  }

  const tagInfo = await dependencies.scm.getTagInfo(
    event.owner,
    event.repo,
    ref,
    dependencies.serverConfig
  );
  if (tagInfo.data.object == null || tagInfo.data.object.sha == null) {
    dependencies.logger.verbose(
      "Unable to find sha for tag, unlable to continue"
    );
    return { status: "unable to find sha for this tag" };
  }

  const sha = tagInfo.data.object.sha;
  dependencies.logger.verbose("Found sha: " + sha);

  const repoConfig = await config.findRepoConfig(
    event.owner,
    event.repo,
    sha,
    dependencies.serverConfig.stampedeFileName,
    dependencies.scm,
    dependencies.cache,
    dependencies.serverConfig
  );
  if (repoConfig == null) {
    dependencies.logger.verbose(
      "Unable to determine config, no found in Redis or the project. Unable to continue"
    );
    return { status: "config not found" };
  }

  if (repoConfig.releases == null) {
    dependencies.logger.verbose(
      "No release builds configured, unable to continue."
    );
    return { status: "releases config not found" };
  }

  let releaseConfig =
    event.draft === true && repoConfig.releases.draft != null
      ? repoConfig.releases.draft
      : repoConfig.releases.published;
  if (releaseConfig == null) {
    dependencies.logger.verbose(
      "No release config found under draft or published."
    );
    return { status: "releases config not found" };
  }

  if (releaseConfig.tasks.length === 0) {
    dependencies.logger.verbose("Task list was empty. Unable to continue.");
    return { status: "task list was empty" };
  }

  const buildDetails = {
    owner: event.owner,
    repo: event.repo,
    sha: event.sha,
    release: event.release,
    buildKey: safeBuildKey(event.release),
  };

  const scmDetails = {
    id: dependencies.serverConfig.scm,
    cloneURL: event.cloneURL,
    sshURL: event.sshURL,
    release: {
      name: event.release,
      tag: event.tag,
      sha: sha,
      body: event.body,
    },
  };

  build.startBuild(
    buildDetails,
    dependencies.scm,
    scmDetails,
    repoConfig,
    releaseConfig,
    releaseConfig.tasks,
    [],
    dependencies.cache,
    dependencies.serverConfig,
    dependencies.db,
    dependencies.logger,
    "release"
  );
  return { status: "tasks created for the release" };
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
    action: body.action,
    created: body.created,
    deleted: body.deleted,
    release: body.release.name,
    tag: body.release.tag_name,
    cloneURL: body.repository.clone_url,
    sshURL: body.repository.ssh_url,
    prerelease: body.release.prerelease,
    body: body.release.body,
    draft: body.release.draft,
    target: body.release.target_commitish,
  };
}

/**
 * safeBuildKey
 * Create a safe build key, replacing any characters that would be
 * unsafe to use when creating the working folder
 * @param {*} release
 */
function safeBuildKey(release) {
  const spacesRemoved = release.replace(/ /g, "_");
  const openParamRemoved = spacesRemoved.replace(/\(/g, "_");
  const closedParamRemoved = openParamRemoved.replace(/\)/g, "_");
  return sanitize(closedParamRemoved);
}

module.exports.handle = handle;
