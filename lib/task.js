'use strict'

const chalk = require('chalk')
const taskDetail = require('./taskDetail')
const notification = require('./notification')
const taskQueue = require('./taskQueue')

/**
 * startTasks
 * @param {*} owner
 * @param {*} repo
 * @param {*} buildKey
 * @param {*} sha
 * @param {*} tasks
 * @param {*} buildPath
 * @param {*} buildNumber
 * @param {*} scm
 * @param {*} scmDetails
 * @param {*} cache
 * @param {*} repoConfig
 * @param {*} serverConf
*/
async function startTasks(owner, repo, buildKey, sha, tasks, buildPath, buildNumber,
  scm, scmDetails, cache, repoConfig, serverConf) {
  for (let index = 0; index < tasks.length; index++) {
    const task = tasks[index]
    const external_id = buildPath + '-' + buildNumber + '-' + task.id + '-' + index.toString()
    const taskTitle = await taskDetail.taskTitle(task.id, task, cache)
    const taskConfig = await taskDetail.taskConfig(task.id, repoConfig.pullrequests, task, cache)
    const started_at = new Date()

    // create the github check
    if (scmDetails.pullRequest != null) {
      const checkRun = await scm.createCheckRun({
        owner: owner,
        repo: repo,
        name: taskTitle,
        head_sha: sha,
        external_id: external_id,
        started_at: started_at,
        serverConf: serverConf,
      })
      scmDetails.checkRunID = checkRun.data.id
    }
    scmDetails.externalID = external_id

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
      scm: scmDetails,
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

    // TODO: If the task has any onSuccess or onFailure childtasks, we need to
    // add these to the build info as potential tasks.
  }
}

module.exports.startTasks = startTasks
