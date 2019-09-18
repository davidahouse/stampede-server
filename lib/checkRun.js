'use strict'

const chalk = require('chalk')

const config = require('./config')
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
 */
async function createCheckRun(owner, repo, sha, pullRequest, cloneURL, sshURL, octokit, cache) {
  console.log(chalk.green('--- Creating check run for ' + owner + ' ' +
                          repo + ' PR ' + pullRequest.number))

  const repoConfig = await config.findRepoConfig(owner, repo, sha, octokit, cache)
  if (repoConfig == null) {
    console.log(chalk.red('--- Unable to determine config, no found in Redis or the project. Unable to continue'))
    return
  }

  console.dir(repoConfig.pullrequests)
  console.dir(repoConfig.pullrequests.tasks)
  if (repoConfig.pullrequests.tasks.length === 0) {
    console.log(chalk.red('--- Task list was empty. Unable to continue.'))
    return
  }

  const buildPath = owner + '-' + repo + '-pullrequest-' + pullRequest.number
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
    const external_id = buildPath + '-' + buildNumber + '-' + task.id

    const taskInfo = await cache.fetchTaskConfig(task.id)
    if (taskInfo == null || taskInfo.title == null) {
      console.log('--- No task info found for ' + task.id)
      continue
    }

    const started_at = new Date()

    // create the github check
    const checkRun = await octokit.checks.create({
      owner: owner,
      repo: repo,
      name: taskInfo.title,
      head_sha: sha,
      status: 'queued',
      external_id: external_id,
      started_at: started_at,
    })

    // store the initial task details
    const taskDetails = {
      owner: owner,
      repository: repo,
      buildNumber: buildNumber,
      pullRequest: pullRequest,
      config: repoConfig.pullrequests,
      task: {
        id: task.id,
      },
      status: 'queued',
      external_id: external_id,
      buildID: buildPath + '-' + buildNumber,
      clone_url: cloneURL,
      ssh_url: sshURL,
      started_at: started_at,
      checkRunID: checkRun.data.id,
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
