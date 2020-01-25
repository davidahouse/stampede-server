"use strict";

const chalk = require("chalk");
const taskDetail = require("./taskDetail");
const notification = require("./notification");
const taskQueue = require("./taskQueue");

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
 * @param {*} overrideTaskQueue
 * @param {*} cache
 * @param {*} repoConfig
 * @param {*} buildConfig
 * @param {*} serverConf
 * @param {*} db
 */
async function startTasks(
  owner,
  repo,
  buildKey,
  sha,
  tasks,
  buildPath,
  buildNumber,
  scm,
  scmDetails,
  overrideTaskQueue,
  cache,
  repoConfig,
  buildConfig,
  serverConf,
  db
) {
  // Add the main tasks to the active list before we perform other tasks so that
  // as notifications come back in we know if the build is finished or not.
  for (let index = 0; index < tasks.length; index++) {
    await addTaskToActiveList(
      buildPath,
      buildNumber,
      tasks[index],
      index,
      cache
    );
  }

  // Start our main tasks
  for (let index = 0; index < tasks.length; index++) {
    await startTask(
      owner,
      repo,
      buildKey,
      sha,
      tasks[index],
      index,
      buildPath,
      buildNumber,
      scm,
      scmDetails,
      overrideTaskQueue,
      cache,
      repoConfig,
      buildConfig,
      serverConf,
      db
    );
  }
}

/**
 * addTaskToActiveList
 * @param {*} buildPath
 * @param {*} buildNumber
 * @param {*} task
 * @param {*} taskNumber
 * @param {*} cache
 */
async function addTaskToActiveList(
  buildPath,
  buildNumber,
  task,
  taskNumber,
  cache
) {
  const isValid = await taskDetail.isValidTask(task.id, cache);
  if (isValid == false) {
    return;
  }

  const taskID =
    buildPath + "-" + buildNumber + "-" + task.id + "-" + taskNumber.toString();
  await cache.addTaskToActiveList(buildPath + "-" + buildNumber, taskID);
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
 * @param {*} overrideTaskQueue
 * @param {*} cache
 * @param {*} repoConfig
 * @param {*} buildConfig
 * @param {*} serverConf
 * @param {*} db
 */
async function startTask(
  owner,
  repo,
  buildKey,
  sha,
  task,
  taskNumber,
  buildPath,
  buildNumber,
  scm,
  scmDetails,
  overrideTaskQueue,
  cache,
  repoConfig,
  buildConfig,
  serverConf,
  db
) {
  const isValid = await taskDetail.isValidTask(task.id, cache);
  if (isValid == false) {
    return;
  }

  const taskID =
    buildPath + "-" + buildNumber + "-" + task.id + "-" + taskNumber.toString();
  console.log(chalk.green("--- starting task: " + taskID));
  console.log("repoConfig:");
  console.dir(repoConfig);
  const taskTitle = await taskDetail.taskTitle(task.id, task, cache);
  const taskConfig = await taskDetail.taskConfig(
    task.id,
    repoConfig,
    buildConfig,
    task,
    owner,
    repo,
    cache
  );
  const workerConfig = await taskDetail.taskWorkerConfig(task.id, cache);
  const started_at = new Date();

  // create the github check
  if (scmDetails.pullRequest != null) {
    const checkRun = await scm.createCheckRun(
      owner,
      repo,
      taskTitle,
      sha,
      taskID,
      started_at,
      serverConf
    );
    scmDetails.checkRunID = checkRun.data.id;
  }

  // store the initial task details
  const taskDetails = {
    owner: owner,
    repository: repo,
    buildKey: buildKey,
    buildNumber: buildNumber,
    buildID: buildPath + "-" + buildNumber,
    taskID: taskID,
    status: "queued",
    task: {
      id: task.id,
      number: taskNumber
    },
    config: taskConfig,
    workerConfig: workerConfig,
    scm: scmDetails,
    stats: {
      queuedAt: started_at
    }
  };

  let queueName = await taskDetail.taskQueue(taskDetails.task.id, cache);
  if (queueName != null) {
    if (overrideTaskQueue != null) {
      queueName = overrideTaskQueue;
    }
    console.log(chalk.green("--- Creating task: " + taskID));
    try {
      await db.storeTaskStart(
        taskDetails.taskID,
        taskDetails.buildID,
        taskDetails.task.id,
        taskDetails.status,
        taskDetails.stats.queuedAt
      );
      await db.storeTaskDetails(taskDetails.taskID, taskDetails);
    } catch (e) {
      console.log(chalk.red("Error Storing task start details: " + e));
    }
    await notification.taskStarted(taskID, taskDetails);
    taskDetails.taskQueue = queueName;
    console.log(chalk.green("--- Adding task to queue: " + queueName));
    const queue = taskQueue.createTaskQueue("stampede-" + queueName);
    await queue.add(taskDetails, {
      removeOnComplete: true,
      removeOnFail: true
    });
    await queue.close();
  } else {
    console.log(chalk.red("--- Unable to determine queue name"));
  }
}

module.exports.startTasks = startTasks;
