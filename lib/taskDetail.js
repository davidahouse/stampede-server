"use strict";

/**
 * isValidTask
 * @param {*} taskID
 * @param {*} cache
 * @return {Boolean} if task is valid or not
 */
async function isValidTask(taskID, cache) {
  const globalTaskConfig = await cache.fetchTaskConfig(taskID);
  return globalTaskConfig != null ? true : false;
}

/**
 * taskTitle
 * @param {*} taskID
 * @param {*} taskConfig
 * @param {*} cache
 * @return {*} The task title
 */
async function taskTitle(taskID, taskConfig, cache) {
  if (taskConfig.title != null) {
    return taskConfig.title;
  } else {
    const globalTasksConfig = await cache.fetchTaskConfig(taskID);
    if (globalTasksConfig != null && globalTasksConfig.title != null) {
      return globalTasksConfig.title;
    } else {
      return null;
    }
  }
}

/**
 * taskConfig
 * @param {*} taskID
 * @param {*} repoConfig
 * @param {*} taskConfig
 * @param {*} cache
 * @return {*} an object containing the task config
 */
async function taskConfig(taskID, repoConfig, buildConfig, taskConfig, cache) {
  const globalTasksConfig = await cache.fetchTaskConfig(taskID);
  if (globalTasksConfig == null || globalTasksConfig.config == null) {
    return {};
  }

  const globalDefaults = await cache.fetchSystemDefaults();
  const globalOverrides = await cache.fetchSystemOverrides();
  let config = {};
  console.log("--- global task config:");
  console.dir(globalTasksConfig.config);
  for (let index = 0; index < globalTasksConfig.config.length; index++) {
    const key = globalTasksConfig.config[index].key;
    console.log("--- key: " + key);
    // System default
    let value = globalDefaults.defaults[key];
    let source = "systemDefault";
    // Top level repo config
    if (repoConfig.config != null && repoConfig.config[key] != null) {
      value = repoConfig.config[key];
      source = "repoConfig";
    }
    // Build config
    if (buildConfig.config != null && buildConfig.config[key] != null) {
      value = buildConfig.config[key];
      source = "buildConfig";
    }
    // Task config
    if (taskConfig.config != null && taskConfig.config[key] != null) {
      value = taskConfig.config[key];
      source = "taskConfig";
    }
    // System override
    if (globalOverrides.overrides[key] != null) {
      value = globalOverrides.overrides[key];
      source = "overrides";
    }
    if (value != null) {
      config[key] = { value: value, source: source };
      console.log("--- derived value for " + key + " from " + source);
    }
  }
  console.log("--- task config is:");
  console.dir(config);
  return config;
}

/**
 * taskQueue
 * @param {*} taskID
 * @param {*} cache
 */
async function taskQueue(taskID, cache) {
  const globalTaskConfig = await cache.fetchTaskConfig(taskID);
  if (globalTaskConfig == null) {
    return null;
  }
  return globalTaskConfig.taskQueue;
}

/**
 * taskWorkerConfig
 * @param {*} taskID
 * @param {*} cache
 */
async function taskWorkerConfig(taskID, cache) {
  const globalTaskConfig = await cache.fetchTaskConfig(taskID);
  if (globalTaskConfig == null || globalTaskConfig.worker == null) {
    return {};
  }
  return globalTaskConfig.worker;
}

module.exports.isValidTask = isValidTask;
module.exports.taskTitle = taskTitle;
module.exports.taskConfig = taskConfig;
module.exports.taskQueue = taskQueue;
module.exports.taskWorkerConfig = taskWorkerConfig;
