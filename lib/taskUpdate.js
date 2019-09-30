'use strict'

const notification = require('../lib/notification')

/**
 * handle task update
 * @param {*} job
 * @param {*} conf
 * @param {*} cache
 * @param {*} scm
 */
async function handle(job, serverConf, cache, scm) {
  console.log('--- taskUpdate:')
  const event = job.data
  console.dir(event)

  // Update task in the cache and send out notifications
  if (event.status === 'completed') {
    await cache.removeTaskFromActiveList(event.buildID, event.task.id)
    const remainingTasks = await cache.fetchActiveTasks(event.buildID)
    await notification.taskCompleted(event.buildID + '-' + event.task.id, event)
    if (remainingTasks == null || remainingTasks.length === 0) {
      await cache.removeBuildFromActiveList(event.buildID)
      await notification.buildCompleted(event.buildID, {})
    }
  } else {
    await notification.taskUpdated(event.buildID + '-' + event.task.id, event)
  }

  // If this update isn't for a PR check, then the rest of the flow is meaningless
  if (event.checkRunID == null) {
    console.log('--- skipping since it is not a check update')
    return
  }

  const update = {
    owner: event.owner,
    repo: event.repository,
    status: event.status,
    check_run_id: event.scm.checkRunID,
  }

  if (event.conclusion != null) {
    update.conclusion = event.result.conclusion
    update.completed_at = new Date().toISOString()
  }

  if (event.result.output != null) {
    update.output = event.result.output
  }
  console.dir(update)
  console.log('--- updating check')
  scm.updateCheck(event.owner, event.repository, serverConf, update)
}

module.exports.handle = handle
