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
 * @param {*} buildConfig
 * @param {*} serverConf
*/
async function startTasks(owner, repo, buildKey, sha, tasks, buildPath, buildNumber,
  scm, scmDetails, cache, repoConfig, buildConfig, serverConf) {
  // Start our main tasks
  for (let index = 0; index < tasks.length; index++) {
    await startTask(owner, repo, buildKey, sha, tasks[index], index, buildPath, buildNumber,
      scm, scmDetails, cache, repoConfig, buildConfig, serverConf)
  }
  // Setup any pending build onComplete tasks
  if (buildConfig.onCompleted != null) {
    console.log('--- adding onCompleted tasks to pending list')
    for (let index = 0; index < tasks.length; index++) {
      const task = buildConfig.onCompleted[index]
      await addTaskToPending(owner, repo, buildKey, buildPath + '-' + buildNumber + '-pending', task,
        (tasks.length + index).toString(), buildPath, buildNumber, scm, scmDetails,
        cache, repoConfig, buildConfig, serverConf)
    }
  }
}

/**
 * queuePendingTask
 * @param {*} task
 * @param {*} scm
 * @param {*} cache
 * @param {*} serverConf
 */
async function queuePendingTask(task, scm, cache, serverConf) {
  console.log(chalk.green('--- starting pending task: ' + task.taskID))
  const taskTitle = await taskDetail.taskTitle(task.task.id, task.task, cache)
  const started_at = new Date()
  const taskDetails = task

  // create the github check
  if (task.scm.pullRequest != null) {
    const checkRun = await scm.createCheckRun(
      task.owner, task.repo, taskTitle,
      task.scm.sha, task.taskID,
      started_at, serverConf)
    taskDetails.scm.checkRunID = checkRun.data.id
  }

  // Assign a few more details to the task
  taskDetails.stats = {
    queuedAt: started_at,
  }

  console.log(chalk.green('--- Creating task: ' + task.taskID))
  await cache.addTaskToActiveList(task.buildID, task.taskID)
  console.log(chalk.green('--- added task to active list: ' + task.buildID))
  notification.taskStarted(task.taskID, taskDetails)
  const queueName = await taskDetail.taskQueue(taskDetails.task.id, cache, serverConf)
  console.log(chalk.green('--- Adding task to queue: ' + queueName))
  const queue = taskQueue.createTaskQueue('stampede-' + queueName)
  await queue.add(taskDetails)
  await queue.close()
}

/**
 * startTask
 * @param {*} owner
 * @param {*} repo
 * @param {*} buildKey
 * @param {*} sha
 * @param {*} task
 * @param {*} buildPath
 * @param {*} buildNumber
 * @param {*} scm
 * @param {*} scmDetails
 * @param {*} cache
 * @param {*} repoConfig
 * @param {*} buildConfig
 * @param {*} serverConf
 */
async function startTask(owner, repo, buildKey, sha, task, taskNumber, buildPath, buildNumber,
  scm, scmDetails, cache, repoConfig, buildConfig, serverConf) {
  const taskID = buildPath + '-' + buildNumber + '-' + task.id + '-' + taskNumber.toString()
  console.log(chalk.green('--- starting task: ' + taskID))
  console.log('repoConfig:')
  console.dir(repoConfig)
  const taskTitle = await taskDetail.taskTitle(task.id, task, cache)
  const taskConfig = await taskDetail.taskConfig(task.id, repoConfig, buildConfig, task, cache)
  const started_at = new Date()

  // create the github check
  if (scmDetails.pullRequest != null) {
    const checkRun = await scm.createCheckRun(
      owner, repo, taskTitle,
      sha, taskID, started_at,
      serverConf)
    scmDetails.checkRunID = checkRun.data.id
  }

  // store the initial task details
  const taskDetails = {
    owner: owner,
    repository: repo,
    buildKey: buildKey,
    buildNumber: buildNumber,
    buildID: buildPath + '-' + buildNumber,
    taskID: taskID,
    status: 'queued',
    task: {
      id: task.id,
      number: taskNumber,
    },
    config: taskConfig,
    scm: scmDetails,
    stats: {
      queuedAt: started_at,
    },
  }

  console.log('--- checking for onSuccess tasks')
  console.dir(task.onSuccess)
  if (task.onSuccess != null) {
    for (let successIndex = 0; successIndex < task.onSuccess.length; successIndex++) {
      console.log('--- saving onSuccess task: ' + task.onSuccess[successIndex].id)
      await addTaskToPending(owner, repo, buildKey, taskID + '-success', task.onSuccess[successIndex],
        taskNumber + 's' + successIndex.toString(), buildPath, buildNumber, scm, scmDetails,
        cache, repoConfig, buildConfig, serverConf)
    }
  }

  if (task.onFailure != null) {
    for (let failureIndex = 0; failureIndex < task.onFailure.length; failureIndex++) {
      console.log('--- saving onFailure task: ' + task.onFailure[failureIndex].id)
      await addTaskToPending(owner, repo, buildKey, taskID + '-failure', task.onFailure[failureIndex],
        taskNumber + 'f' + failureIndex.toString(), buildPath, buildNumber, scm, scmDetails,
        cache, repoConfig, buildConfig, serverConf)
    }
  }

  console.log(chalk.green('--- Creating task: ' + taskID))
  await cache.addTaskToActiveList(buildPath + '-' + buildNumber, taskID)
  await notification.taskStarted(taskID, taskDetails)
  const queueName = await taskDetail.taskQueue(taskDetails.task.id, cache, serverConf)
  console.log(chalk.green('--- Adding task to queue: ' + queueName))
  const queue = taskQueue.createTaskQueue('stampede-' + queueName)
  await queue.add(taskDetails)
  await queue.close()
}

/**
 * addTaskToPending
 * @param {*} owner
 * @param {*} repo
 * @param {*} buildKey
 * @param {*} sha
 * @param {*} parentTaskID
 * @param {*} task
 * @param {*} taskNumber
 * @param {*} buildPath
 * @param {*} buildNumber
 * @param {*} scm
 * @param {*} scmDetails
 * @param {*} cache
 * @param {*} repoConfig
 * @param {*} serverConf
 */
async function addTaskToPending(owner, repo, buildKey, parentTaskID, task, taskNumber,
  buildPath, buildNumber, scm, scmDetails, cache, repoConfig, buildConfig, serverConf) {
  const taskID = buildPath + '-' + buildNumber + '-' + task.id + '-' + taskNumber
  const taskConfig = await taskDetail.taskConfig(task.id, repoConfig, buildConfig, task, cache)

  // store the initial task details
  const taskDetails = {
    owner: owner,
    repository: repo,
    buildKey: buildKey,
    buildNumber: buildNumber,
    buildID: buildPath + '-' + buildNumber,
    taskID: taskID,
    status: 'pending',
    task: {
      id: task.id,
      number: taskNumber,
    },
    config: taskConfig,
    scm: scmDetails,
  }
  console.log(chalk.green('--- Adding pending task: ' + taskID))
  await cache.addTaskToPendingList(parentTaskID, taskDetails)
}

module.exports.startTasks = startTasks
module.exports.queuePendingTask = queuePendingTask
