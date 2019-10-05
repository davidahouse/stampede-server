'use strict'

const chalk = require('chalk')
const notification = require('../lib/notification')
const task = require('./task')

/**
 * handle task update
 * @param {*} job
 * @param {*} conf
 * @param {*} cache
 * @param {*} scm
 */
async function handle(job, serverConf, cache, scm) {
  try {
    console.log(chalk.green('--- taskUpdate: ' + job.data.taskID))
    const event = job.data
//    console.dir(event)

    const taskID = event.taskID

    // Update task in the cache and send out notifications
    if (event.status === 'completed') {
      // Remove this task from the active list
      await cache.removeTaskFromActiveList(event.buildID, taskID)
      await notification.taskCompleted(taskID, event)

      console.log(chalk.green('--- Task status is: ' + event.status))
      if (event.result.conclusion === 'success') {
        const onSuccessTasks = await cache.pendingTasks(taskID + '-success')
        if (onSuccessTasks != null) {
          for (let index = 0; index < onSuccessTasks.length; index++) {
            await task.queuePendingTask(onSuccessTasks[index], scm, cache, serverConf)
          }
        }
      } else {
        const onFailureTasks = await cache.pendingTasks(taskID + '-failure')
        if (onFailureTasks != null) {
          for (let index = 0; index < onFailureTasks.length; index++) {
            await task.queuePendingTask(onFailureTasks[index], scm, cache, serverConf)
          }
        }
      }
      await cache.removePendingList(taskID + '-success')
      await cache.removePendingList(taskID + '-failure')

      console.log(chalk.green('--- Checking number of active tasks for: ' + event.buildID))
      const remainingTasks = await cache.fetchActiveTasks(event.buildID)
      console.log(chalk.green('--- Build has ' + remainingTasks.length.toString() + ' remaining task(s)'))
      if (remainingTasks == null || remainingTasks.length === 0) {

        // Check to see if we have any pending onCompleted tasks. These happen at the end of the build
        // if we have some, the build isn't fully complete yet, so queue these tasks. Otherwise build is
        // totally complete and we can send out notifications and cleanup
        const onCompletedTasks = await cache.pendingTasks(event.buildID + '-pending')
        await cache.removePendingList(event.buildID + '-pending')

        if (onCompletedTasks != null && onCompletedTasks.length > 0) {
          for (let index = 0; index < onCompletedTasks.length; index++) {
            await task.queuePendingTask(onCompletedTasks[index], scm, cache, serverConf)
          }
        } else {
          await cache.removeBuildFromActiveList(event.buildID)
          await notification.buildCompleted(event.buildID, {
            owner: event.owner,
            repository: event.repository,
            buildKey: event.buildKey,
            build: event.buildNumber,
          })
        }
      }
    } else {
      await notification.taskUpdated(taskID, event)
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
  } catch (e) {
    console.log(chalk.red(e))
  }
}

module.exports.handle = handle
