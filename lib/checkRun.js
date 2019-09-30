'use strict'

const chalk = require('chalk')

const config = require('./config')
const taskDetail = require('./taskDetail')
const taskQueue = require('./taskQueue')
const notification = require('../lib/notification')

/**
 * Create a check run
 * @param {*} owner
 * @param {*} repo
 * @param {*} sha
 * @param {*} pullRequest
 * @param {*} cloneURL
 * @param {*} octokit
 * @param {*} cache
 * @param {*} serverConf
 */
async function createCheckRun(owner, repo, sha, pullRequest, cloneURL, sshURL,
  stampedeFileName, scm, cache, serverConf) {
  console.log(chalk.green('--- Creating check run for ' + owner + ' ' +
                          repo + ' PR ' + pullRequest.number))

  const repoConfig = await config.findRepoConfig(owner, repo, sha, stampedeFileName,
    scm, cache, serverConf)
  console.dir(repoConfig)
  if (repoConfig == null) {
    console.log(chalk.red('--- Unable to determine config, no found in Redis or the project. Unable to continue'))
    return
  }

  if (repoConfig.pullrequests == null || repoConfig.pullrequests.tasks == null) {
    console.log(chalk.red('--- Unable to find tasks. Unable to continue.'))
    return
  }

  console.dir(repoConfig.pullrequests)
  console.dir(repoConfig.pullrequests.tasks)
  if (repoConfig.pullrequests.tasks.length === 0) {
    console.log(chalk.red('--- Task list was empty. Unable to continue.'))
    return
  }

  const buildKey = 'pullrequest-' + pullRequest.number
  const buildPath = owner + '-' + repo + '-' + buildKey
  console.log(chalk.green('--- Build path: ' + buildPath))

  // determine our build number
  const buildNumber = await cache.incrementBuildNumber(buildPath)
  console.log(chalk.green('--- Created build number: ' + buildNumber))

  // create the build in redis
  const buildDetails = {
    owner: owner,
    repository: repo,
    sha: sha,
    pullRequest: pullRequest,
    build: buildNumber,
  }
  await cache.addBuildToActiveList(buildPath + '-' + buildNumber)
  notification.buildStarted(buildPath + '-' + buildNumber, buildDetails)

  // Now queue the tasks
  const tasks = repoConfig.pullrequests.tasks
  for (let index = 0; index < tasks.length; index++) {
    const task = tasks[index]
    const external_id = buildPath + '-' + buildNumber + '-' + task.id + '-' + index.toString()

    const taskTitle = await taskDetail.taskTitle(task.id, task, cache)
    const taskConfig = await taskDetail.taskConfig(task.id, repoConfig.pullrequests, task, cache)
    const started_at = new Date()

    // create the github check
    const checkRun = await scm.createCheckRun({
      owner: owner,
      repo: repo,
      name: taskTitle,
      head_sha: sha,
      external_id: external_id,
      started_at: started_at,
      serverConf: serverConf,
    })

    // store the initial task details
    const taskDetails = {
      owner: owner,
      repository: repo,
      buildKey: buildKey,
      buildNumber: buildNumber,
      buildID: buildPath + '-' + buildNumber,
      status: 'queued',
      task: {
        id: task.id,
        number: index,
      },
      config: taskConfig,
      scm: {
        id: serverConf.scm,
        externalID: external_id,
        pullRequest: pullRequest,
        cloneURL: cloneURL,
        sshURL: sshURL,
        checkRunID: checkRun.data.id,
      },
      stats: {
        queuedAt: started_at,
      },
    }
    console.log(chalk.green('--- Creating task: ' + task.id))
    await cache.addTaskToActiveList(buildPath + '-' + buildNumber, task.id)
    notification.taskStarted(external_id, taskDetails)
    console.log(chalk.green('--- Adding task to queue: ' + taskDetails.task.id))
    const queue = taskQueue.createTaskQueue('stampede-' + taskDetails.task.id)
    queue.add(taskDetails)
  }
}

module.exports.createCheckRun = createCheckRun
