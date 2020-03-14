"use strict";

const task = require("./task");
const notification = require("../lib/notification");

/**
 * startBuild
 * @param {*} buildDetails
 * @param {*} scm
 * @param {*} scmDetails
 * @param {*} repoConfig
 * @param {*} buildConfig
 * @param {*} tasks
 * @param {*} actions
 * @param {*} cache
 * @param {*} serverConf
 * @param {*} db
 * @param {*} logger
 */
async function startBuild(
  buildDetails,
  scm,
  scmDetails,
  repoConfig,
  buildConfig,
  tasks,
  actions,
  cache,
  serverConf,
  db,
  logger
) {
  logger.verbose("Start Build:");

  const buildPath =
    buildDetails.owner + "-" + buildDetails.repo + "-" + buildDetails.buildKey;
  buildDetails.buildPath = buildPath;
  logger.verbose("Build path: " + buildDetails.buildPath);

  // determine our build number
  const buildNumber = await cache.incrementBuildNumber(
    buildDetails.owner + "-" + buildDetails.repo + "-buildNumber"
  );
  buildDetails.buildNumber = buildNumber;
  logger.verbose("Created build number: " + buildDetails.buildNumber);

  // Store the repo config along with the build details so we can reference it
  // later
  buildDetails.stampedeConfig = repoConfig;

  // Get an access token for any tasks to use for this build
  const accessToken = await scm.getAccessToken(
    buildDetails.owner,
    buildDetails.repo,
    serverConf
  );
  scmDetails.accessToken = accessToken;

  // Get the build started in the cache and then the initial tasks
  await cache.addBuildToActiveList(
    buildDetails.buildPath + "-" + buildDetails.buildNumber
  );
  try {
    await db.storeRepository(buildDetails.owner, buildDetails.repo);
    await db.storeBuildStart(
      buildDetails.buildPath + "-" + buildDetails.buildNumber,
      buildDetails.owner,
      buildDetails.repo,
      buildDetails.buildKey,
      buildDetails.buildNumber
    );
  } catch (e) {
    logger.error("Error storing build started details: " + e);
  }
  notification.buildStarted(
    buildDetails.buildPath + "-" + buildDetails.buildNumber,
    buildDetails
  );

  // Create the general Stampede Build Check
  scm.createStampedeCheck(
    buildDetails.owner,
    buildDetails.repo,
    buildDetails.sha,
    buildDetails.buildPath + "-" + buildDetails.buildNumber,
    actions,
    serverConf
  );

  task.startTasks(
    buildDetails.owner,
    buildDetails.repo,
    buildDetails.buildKey,
    buildDetails.sha,
    tasks,
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

module.exports.startBuild = startBuild;
