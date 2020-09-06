"use strict";

let client;

function setClient(redisClient) {
  client = redisClient;
}

/**
 * fetch all the repository builds for a repo
 * @param {*} org
 * @param {*} repo
 */
async function fetchRepositoryBuilds(org, repo) {
  const builds = await client.fetchMembers(
    "stampede-" + org + "-" + repo + "-repositoryBuilds",
    []
  );
  return builds;
}

/**
 * Remove a single repository build
 * @param {*} org
 * @param {*} repo
 * @param {*} build
 */
async function removeRepositoryBuild(org, repo, build) {
  await client.removeMember(
    "stampede-" + org + "-" + repo + "-repositoryBuilds",
    build
  );
  await client.remove("stampede-" + org + "-" + repo + "-" + build);
}

/**
 * Add/update a repository build
 * @param {*} org
 * @param {*} repo
 * @param {*} build
 */
async function updateRepositoryBuild(org, repo, build) {
  await client.add(
    "stampede-" + org + "-" + repo + "-repositoryBuilds",
    build.id
  );
  await client.store("stampede-" + org + "-" + repo + "-" + build.id, build);
}

/**
 * Fetch a single repository build
 * @param {*} org
 * @param {*} repo
 * @param {*} build
 */
async function fetchRepositoryBuild(org, repo, build) {
  const buildInfo = await client.fetch(
    "stampede-" + org + "-" + repo + "-" + build,
    null
  );
  return buildInfo;
}

module.exports.setClient = setClient;
module.exports.fetchRepositoryBuilds = fetchRepositoryBuilds;
module.exports.removeRepositoryBuild = removeRepositoryBuild;
module.exports.updateRepositoryBuild = updateRepositoryBuild;
module.exports.fetchRepositoryBuild = fetchRepositoryBuild;
