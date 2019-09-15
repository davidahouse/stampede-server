'use strict'

const chalk = require('chalk')

const auth = require('../lib/auth')
const config = require('../lib/config')
const taskQueue = require('../lib/taskQueue')

/**
 * handle event
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 */
async function handle(req, serverConf, redisClient) {

  // Parse the incoming body into the parts we care about
  const event = parseEvent(req)
  console.log('--- PushEvent:')
  console.dir(event)

  if (event.created === true || event.deleted === true) {
    console.log('--- Ignoring push since it is created or deleted')
    return {status: 'ignoring due to created or pushed'}
  }

  const octokit = await auth.getAuthorizedOctokit(event.owner, event.repo, serverConf)

  const repoConfig = await config.findRepoConfig(event.owner, event.repo, event.sha,
    octokit, redisClient)
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
      const buildNumber = await redisClient.increment('stampede-' + buildPath)
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
      await redisClient.store('stampede-' + buildPath + '-' + buildNumber, buildDetails)
      await redisClient.add('stampede-activeBuilds', buildPath + '-' + buildNumber)

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
          external_id: external_id,
          clone_url: event.cloneURL,
        }
        console.log(chalk.green('--- Creating task: ' + task.id))
        await redisClient.store('stampede-' + external_id, taskDetails)
        const queue = taskQueue.createTaskQueue('stampede-' + task.id)
        queue.add(taskDetails)
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
