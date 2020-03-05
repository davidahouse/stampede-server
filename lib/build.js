"use strict";

const chalk = require("chalk");
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
  db
) {
  console.log(chalk.red("--- Start Build:"));
  console.dir(buildDetails);
  console.dir(scmDetails);
  console.dir(repoConfig);
  console.dir(buildConfig);
  console.dir(tasks);
  console.dir(actions);

  const buildPath =
    buildDetails.owner + "-" + buildDetails.repo + "-" + buildDetails.buildKey;
  buildDetails.buildPath = buildPath;
  console.log(chalk.green("--- Build path: " + buildDetails.buildPath));

  // determine our build number
  const buildNumber = await cache.incrementBuildNumber(
    buildDetails.owner + "-" + buildDetails.repo + "-buildNumber"
  );
  buildDetails.buildNumber = buildNumber;
  console.log(
    chalk.green("--- Created build number: " + buildDetails.buildNumber)
  );

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
    console.log(chalk.red("Error storing build started details: " + e));
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
    db
  );
}

module.exports.startBuild = startBuild;
