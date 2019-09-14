'use strict'

const chalk = require('chalk')

const config = require('./config')
const taskQueue = require('./taskQueue')

/**
 * Create a check run
 * @param {*} owner
 * @param {*} repo
 * @param {*} sha
 * @param {*} pullRequest
 * @param {*} cloneURL
 * @param {*} octokit
 * @param {*} redisClient
 */
async function createCheckRun(owner, repo, sha, pullRequest, cloneURL, octokit, redisClient) {
  console.log(chalk.green('--- Creating check run for ' + owner + ' ' +
                          repo + ' PR ' + pullRequest.number))

  const repoConfig = await config.findRepoConfig(owner, repo, sha, octokit, redisClient)
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
  const buildNumber = await redisClient.increment('stampede-' + buildPath)
  console.log(chalk.green('--- Created build number: ' + buildNumber))

  // create the build in redis
  const buildDetails = {
    owner: owner,
    repository: repo,
    sha: sha,
    pullRequest: pullRequest,
    build: buildNumber,
  }
  await redisClient.store('stampede-' + buildPath + '-' + buildNumber, buildDetails)
  await redisClient.add('stampede-activeBuilds', buildPath + '-' + buildNumber)

  // Now queue the tasks
  const tasks = repoConfig.pullrequests.tasks
  for (let index = 0; index < tasks.length; index++) {
    const task = tasks[index]
    const external_id = buildPath + '-' + buildNumber + '-' + task.id

    const taskInfo = await redisClient.fetch('stampede-tasks-' + task.id)

    // create the github check
    octokit.checks.create({
      owner: owner,
      repo: repo,
      name: taskInfo.title,
      head_sha: sha,
      external_id: external_id,
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
      clone_url: cloneURL,
    }
    console.log(chalk.green('--- Creating task: ' + task.id))
    await redisClient.store('stampede-' + external_id, taskDetails)
  }
}


/**
 * Queue check run
 * @param {*} owner
 * @param {*} repo
 * @param {*} checkRunID
 * @param {*} externalID
 * @param {*} octokit
 * @param {*} redisClient
 */
async function queueCheckRun(owner, repo, checkRunID, externalID, octokit, redisClient) {
  const started_at = new Date()

  console.log(chalk.green('--- Updating check run to queued'))
  await octokit.checks.update({
    owner: owner,
    repo: repo,
    status: 'queued',
    check_run_id: checkRunID,
    started_at: started_at.toISOString(),
  })

  const taskDetails = await redisClient.fetch('stampede-' + externalID)
  if (taskDetails != null) {
    taskDetails.check_run_id = checkRunID
    console.log(chalk.green('--- Adding task to queue: stampede-' + taskDetails.task.id))
    const queue = taskQueue.createTaskQueue('stampede-' + taskDetails.task.id)
    queue.add(taskDetails)
  } else {
    console.log(chalk.red('--- Error finding task details, unable to queue'))
  }
}

module.exports.createCheckRun = createCheckRun
module.exports.queueCheckRun = queueCheckRun
