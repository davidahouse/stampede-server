'use strict'

const chalk = require('chalk')

const auth = require('../lib/auth')
const config = require('../lib/config')
const taskQueue = require('../lib/taskQueue')
const notification = require('../lib/notification')

/**
 * handle event
 * @param {*} req
 * @param {*} serverConf
 * @param {*} cache
 */
async function handle(req, serverConf, cache) {

  // Parse the incoming body into the parts we care about
  const event = parseEvent(req)
  console.log('--- PushEvent:')
  console.dir(event)
  notification.repositoryEventReceived('push', event)

  if (event.created === true || event.deleted === true) {
    console.log('--- Ignoring push since it is created or deleted')
    return {status: 'ignoring due to created or pushed'}
  }

  const octokit = await auth.getAuthorizedOctokit(event.owner, event.repo, serverConf)

  const repoConfig = await config.findRepoConfig(event.owner, event.repo, event.sha,
    octokit, cache)
  if (repoConfig == null) {
    console.log(chalk.red('--- Unable to determine config, no found in Redis or the project. Unable to continue'))
    return {status: 'no repo config found'}
  }

  if (repoConfig.branches == null) {
    console.log(chalk.red('--- No branch builds configured, unable to continue.'))
    return {status: 'no branches configured'}
  }

  console.dir(repoConfig.branches)
  for (let index = 0; index < repoConfig.branches.length; index++) {
    const branchConfig = repoConfig.branches[index]
    if (branchConfig.branch === event.branch) {

      if (branchConfig.tasks.length === 0) {
        console.log(chalk.red('--- Task list was empty. Unable to continue.'))
        continue
      }

      const buildPath = event.owner + '-' + event.repo + '-' + event.branch
      console.log(chalk.green('--- Build path: ' + buildPath))

      // determine our build number
      const buildNumber = await cache.incrementBuildNumber(buildPath)
      console.log(chalk.green('--- Created build number: ' + buildNumber))

      // create the build in redis
      const buildDetails = {
        githubEvent: req.body,
        owner: event.owner,
        repository: event.repo,
        sha: event.sha,
        branch: event.branch,
        build: buildNumber,
      }
      await cache.addBuildToActiveList(buildPath + '-' + buildNumber)
      notification.buildStarted(buildPath + '-' + buildNumber, buildDetails)

      // Now queue the tasks
      const tasks = branchConfig.tasks
      for (let tindex = 0; tindex < tasks.length; tindex++) {
        const task = tasks[tindex]

        const external_id = buildPath + '-' + buildNumber + '-' + task.id

        // store the initial task details
        const taskDetails = {
          owner: event.owner,
          repository: event.repo,
          buildNumber: buildNumber,
          branch: event.branch,
          branch_sha: event.sha,
          config: branchConfig,
          task: {
            id: task.id,
          },
          status: 'queued',
          buildID: buildPath + '-' + buildNumber,
          external_id: external_id,
          clone_url: event.cloneURL,
        }
        console.log(chalk.green('--- Creating task: ' + task.id))
        await cache.addTaskToActiveList(buildPath + '-' + buildNumber, task.id)
        const queue = taskQueue.createTaskQueue('stampede-' + task.id)
        queue.add(taskDetails)
        notification.taskStarted(external_id, taskDetails)
      }
    }
  }
  return {status: 'branch tasks created'}
}

/**
 * parse body into an event object
 * @param {*} req
 * @return {object} event
 */
function parseEvent(req) {
  const fullName = req.body.repository.full_name
  const parts = fullName.split('/')
  const owner = parts[0]
  const repo = parts[1]
  const ref = req.body.ref.split('/')
  return {
    owner: owner,
    repo: repo,
    created: req.body.created,
    deleted: req.body.deleted,
    branch: ref[ref.length - 1],
    // TODO: Need to find the sha for this push
    sha: '',
    cloneURL: req.body.repository.clone_url,
  }
}

module.exports.handle = handle
