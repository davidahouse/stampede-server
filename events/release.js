'use strict'

const chalk = require('chalk')

const config = require('../lib/config')
const taskQueue = require('../lib/taskQueue')
const notification = require('../lib/notification')
const taskDetail = require('../lib/taskDetail')

/**
 * handle event
 * @param {*} req
 * @param {*} serverConf
 * @param {*} cache
 * @param {*} scm
 */
async function handle(req, serverConf, cache, scm) {

  // Parse the incoming body into the parts we care about
  const event = parseEvent(req)
  console.log('--- ReleaseEvent:')
  console.dir(event)
  notification.repositoryEventReceived('release', event)

  if (event.action !== 'created' && event.action !== 'published') {
    console.log('--- Ignoring as the release is not marked as created/published')
    return {status: 'not a created/published release, ignoring'}
  }

  // Find the sha for this release based on the tag unless this is a draft PR. In that
  // case, we need to just try and find the sha from the target branch
  let ref = ''
  if (event.draft === true) {
    console.log('--- Trying to find head sha for branch ' + event.target)
    ref = 'heads/' + event.target
  } else {
    console.log('--- Trying to find sha for ' + event.tag)
    ref = 'tags/' + event.tag
  }

  const tagInfo = await scm.getTagInfo(event.owner, event.repo, ref, serverConf)
  if (tagInfo.data.object == null || tagInfo.data.object.sha == null) {
    console.log(chalk.red('--- Unable to find sha for tag, unlable to continue'))
    return {status: 'unable to find sha for this tag'}
  }

  const sha = tagInfo.data.object.sha
  console.log(chalk.green('--- Found sha: ' + sha))

  const repoConfig = await config.findRepoConfig(event.owner, event.repo, sha, serverConf.stampedeFileName, scm, cache, serverConf)
  if (repoConfig == null) {
    console.log(chalk.red('--- Unable to determine config, no found in Redis or the project. Unable to continue'))
    return {status: 'config not found'}
  }

  if (repoConfig.releases == null) {
    console.log(chalk.red('--- No release builds configured, unable to continue.'))
    return {status: 'releases config not found'}
  }

  let releaseConfig = ((event.draft === true) && (repoConfig.releases.draft != null)) ?
    repoConfig.releases.draft :
    repoConfig.releases.published
  if (releaseConfig == null) {
    console.log(chalk.red('--- No release config found under draft or published.'))
    return {status: 'releases config not found'}
  }

  if (releaseConfig.tasks.length === 0) {
    console.log(chalk.red('--- Task list was empty. Unable to continue.'))
    return {status: 'task list was empty'}
  }

  const buildKey = event.release
  const buildPath = event.owner + '-' + event.repo + '-' + buildKey
  console.log(chalk.green('--- Build path: ' + buildPath))

  // determine our build number
  const buildNumber = await cache.incrementBuildNumber(buildPath)
  console.log(chalk.green('--- Created build number: ' + buildNumber))

  // create the build in redis
  const buildDetails = {
    githubEvent: req.body,
    owner: event.owner,
    repository: event.repo,
    sha: sha,
    release: event.release,
    buildKey: buildKey,
    build: buildNumber,
  }
  await cache.addBuildToActiveList(buildPath + '-' + buildNumber)
  notification.buildStarted(buildPath + '-' + buildNumber, buildDetails)

  // Now queue the tasks
  const tasks = releaseConfig.tasks
  for (let tindex = 0; tindex < tasks.length; tindex++) {
    const task = tasks[tindex]

    const external_id = buildPath + '-' + buildNumber + '-' + task.id + '-' + tindex.toString()
    const taskConfig = await taskDetail.taskConfig(task.id, releaseConfig, task, cache)
    const started_at = new Date()

    // store the initial task details
    const taskDetails = {
      owner: event.owner,
      repository: event.repo,
      buildKey: buildKey,
      buildNumber: buildNumber,
      buildID: buildPath + '-' + buildNumber,
      status: 'queued',
      task: {
        id: task.id,
        number: tindex,
      },
      config: taskConfig,
      scm: {
        id: serverConf.scm,
        release: {
          name: event.release,
          tag: event.tag,
          sha: sha,
        },
        externalID: external_id,
        cloneURL: event.cloneURL,
        sshURL: event.sshURL,
      },
      stats: {
        queuedAt: started_at,
      },
    }
    console.log(chalk.green('--- Creating task: ' + task.id))
    await cache.addTaskToActiveList(buildPath + '-' + buildNumber, task.id)
    const queue = taskQueue.createTaskQueue('stampede-' + task.id)
    queue.add(taskDetails)
    notification.taskStarted(external_id, taskDetails)
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
    action: req.body.action,
    created: req.body.created,
    deleted: req.body.deleted,
    release: req.body.release.name,
    tag: req.body.release.tag_name,
    cloneURL: req.body.repository.clone_url,
    sshURL: req.body.repository.ssh_url,
    prerelease: req.body.release.prerelease,
    draft: req.body.release.draft,
    target: req.body.release.target_commitish,
  }
}

module.exports.handle = handle
