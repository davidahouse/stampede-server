'use strict'

const auth = require('../lib/auth')
const notification = require('../lib/notification')

/**
 * handle task update
 * @param {*} job
 * @param {*} conf
 * @param {*} cache
 */
async function handle(job, serverConf, cache) {
  console.log('--- taskUpdate:')
  const event = job.data
  console.dir(event)

  // Update task in the cache and send out notifications
  if (event.status === 'completed') {
    await cache.removeTaskFromActiveList(event.buildID, event.task.id)
    const remainingTasks = await cache.fetchActiveTasks(event.buildID)
    if (remainingTasks == null || remainingTasks.length === 0) {
      await cache.removeBuildFromActiveList(event.buildID)
      notification.buildCompleted(event.buildID, {})
    }
    notification.taskCompleted(event.buildID + '-' + event.task.id, event)
  } else {
    notification.taskUpdated(event.buildID + '-' + event.task.id, event)
  }

  // If this update isn't for a PR check, then the rest of the flow is meaningless
  if (event.checkRunID == null) {
    console.log('--- skipping since it is not a check update')
    return
  }

  const octokit = await auth.getAuthorizedOctokit(event.owner, event.repository, serverConf)
  const update = {
    owner: event.owner,
    repo: event.repository,
    status: event.status,
    check_run_id: event.checkRunID,
  }

  if (event.conclusion != null) {
    update.conclusion = event.conclusion
    update.completed_at = new Date().toISOString()
  }

  if (event.output != null) {
    update.output = event.output
  }
  console.dir(update)
  console.log('--- updating check')
  await octokit.checks.update(update)
}

module.exports.handle = handle
