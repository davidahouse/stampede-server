'use strict'

const chalk = require('chalk')
const task = require('./task')
const notification = require('../lib/notification')

/**
 * startBuild
 * @param {*} buildDetails
 * @param {*} scm
 * @param {*} scmDetails
 * @param {*} repoConfig
 * @param {*} buildConfig
 * @param {*} cache
 * @param {*} serverConf
 */
async function startBuild(buildDetails, scm, scmDetails, repoConfig, buildConfig,
  tasks, cache, serverConf) {
  const buildPath = buildDetails.owner + '-' + buildDetails.repo + '-' + buildDetails.buildKey
  buildDetails.buildPath = buildPath
  console.log(chalk.green('--- Build path: ' + buildDetails.buildPath))

  // determine our build number
  const buildNumber = await cache.incrementBuildNumber(buildDetails.buildPath)
  buildDetails.buildNumber = buildNumber
  console.log(chalk.green('--- Created build number: ' + buildDetails.buildNumber))

  // Store the repo config along with the build details so we can reference it
  // later
  buildDetails.stampedeConfig = repoConfig

  // Get the build started in the cache and then the initial tasks
  await cache.addBuildToActiveList(buildDetails.buildPath + '-' + buildDetails.buildNumber)
  notification.buildStarted(buildDetails.buildPath + '-' + buildDetails.buildNumber, buildDetails)
  task.startTasks(buildDetails.owner, buildDetails.repo, buildDetails.buildKey, buildDetails.sha,
    tasks, buildPath, buildNumber, scm, scmDetails, cache, repoConfig, buildConfig,
    serverConf)
}

module.exports.startBuild = startBuild
