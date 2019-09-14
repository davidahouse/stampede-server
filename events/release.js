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
  console.log('--- ReleaseEvent:')
  console.dir(event)

  const octokit = await auth.getAuthorizedOctokit(event.owner, event.repo, serverConf)

  // Find the sha for this release based on the tag
  console.log('--- Trying to find sha for ' + event.tag)
  const tagInfo = await octokit.git.getRef({
    owner: event.owner,
    repo: event.repo,
    ref: 'tags/' + event.tag,
  })

  if (tagInfo.data.object == null || tagInfo.data.object.sha == null) {
    console.log(chalk.red('--- Unable to find sha for tag, unlable to continue'))
    return {status: 'unable to find sha for this tag'}
  }

  const sha = tagInfo.data.object.sha
  const repoConfig = await config.findRepoConfig(event.owner, event.repo, sha, octokit, redisClient)
  if (repoConfig == null) {
    console.log(chalk.red('--- Unable to determine config, no found in Redis or the project. Unable to continue'))
    return {status: 'config not found'}
  }

  if (repoConfig.releases == null) {
    console.log(chalk.red('--- No release builds configured, unable to continue.'))
    return {status: 'releases config not found'}
  }

  let releaseConfig = ((event.prerelease === true) && (repoConfig.releases.prerelease != null)) ?
    repoConfig.releases.prerelease :
    repoConfig.releases.published
  if (releaseConfig == null) {
    console.log(chalk.red('--- No release config found under prerelease or published.'))
    return {status: 'releases config not found'}
  }

  if (releaseConfig.tasks.length === 0) {
    console.log(chalk.red('--- Task list was empty. Unable to continue.'))
    return {status: 'task list was empty'}
  }

  const buildPath = event.owner + '-' + event.repo + '-' + event.release
  console.log(chalk.green('--- Build path: ' + buildPath))

  // determine our build number
  const buildNumber = await redisClient.increment('stampede-' + buildPath)
  console.log(chalk.green('--- Created build number: ' + buildNumber))

  // create the build in redis
  const buildDetails = {
    githubEvent: req.body,
    owner: event.owner,
    repository: event.repo,
    sha: sha,
    release: event.release,
    build: buildNumber,
  }
  await redisClient.store('stampede-' + buildPath + '-' + buildNumber, buildDetails)
  await redisClient.add('stampede-activeBuilds', buildPath + '-' + buildNumber)

  // Now queue the tasks
  const tasks = releaseConfig.tasks
  for (let tindex = 0; tindex < tasks.length; tindex++) {
    const task = tasks[tindex]

    const external_id = buildPath + '-' + buildNumber + '-' + task.id

    // store the initial task details
    const taskDetails = {
      owner: event.owner,
      repository: event.repo,
      buildNumber: buildNumber,
      release: event.release,
      tag: event.tag,
      release_sha: sha,
      config: releaseConfig,
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
  return {status: 'tasks created for the release'}
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
  return {
    owner: owner,
    repo: repo,
    created: req.body.created,
    deleted: req.body.deleted,
    release: req.body.release.name,
    tag: req.body.release.tag_name,
    cloneURL: req.body.repository.clone_url,
    prerelease: req.body.release.prerelease,
  }
}

module.exports.handle = handle
