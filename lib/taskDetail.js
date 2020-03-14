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
 * @param {*} owner
 * @param {*} repo
 * @param {*} cache
 * @return {*} an object containing the task config
 */
async function taskConfig(
  taskID,
  repoConfig,
  buildConfig,
  taskConfig,
  owner,
  repo,
  cache
) {
  const globalTasksConfig = await cache.fetchTaskConfig(taskID);
  if (globalTasksConfig == null || globalTasksConfig.config == null) {
    return {};
  }

  // Fetch any defaults or overrides that are in the cache
  const globalDefaults = await cache.fetchSystemDefaults();
  const orgDefaults = await cache.orgConfigDefaults.fetchDefaults(owner);
  const repoDefaults = await cache.repoConfigDefaults.fetchDefaults(
    owner,
    repo
  );
  const globalOverrides = await cache.fetchSystemOverrides();
  const orgOverrides = await cache.orgConfigOverrides.fetchOverrides(owner);
  const repoOverrides = await cache.repoConfigOverrides.fetchOverrides(
    owner,
    repo
  );

  let config = {};
  for (let index = 0; index < globalTasksConfig.config.length; index++) {
    const key = globalTasksConfig.config[index].key;
    // System default
    let value = globalDefaults.defaults[key];
    let source = "systemDefault";
    // Org config
    if (orgDefaults != null && orgDefaults.defaults[key] != null) {
      value = orgDefaults.defaults[key];
      source = "orgDefault";
    }
    // Repo config
    if (repoDefaults != null && repoDefaults.defaults[key] != null) {
      value = repoDefaults.defaults[key];
      source = "repoDefault";
    }
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
    // Repo override
    if (repoOverrides != null && repoOverrides.overrides[key] != null) {
      value = repoOverrides.overrides[key];
      source = "repoOverride";
    }
    // Org override
    if (orgOverrides != null && orgOverrides.overrides[key] != null) {
      value = orgOverrides.overrides[key];
      source = "orgOverride";
    }
    // System override
    if (
      globalOverrides != null &&
      globalOverrides.overrides != null &&
      globalOverrides.overrides[key] != null
    ) {
      value = globalOverrides.overrides[key];
      source = "systemOverride";
    }
    if (value != null) {
      config[key] = { value: value, source: source };
    }
  }
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
