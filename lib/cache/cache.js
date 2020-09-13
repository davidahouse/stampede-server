"use strict";

const client = require("./cacheClient");

// Submodules
const orgConfigDefaults = require("./orgConfigDefaults");
const orgConfigOverrides = require("./orgConfigOverrides");
const repoConfigDefaults = require("./repoConfigDefaults");
const repoConfigOverrides = require("./repoConfigOverrides");
const systemQueues = require("./systemQueues");
const repositoryBuilds = require("./repositoryBuilds");
const admin = require("./admin");
const notifications = require("./notifications");

// Public functions

// General

/**
 * startCache
 * @param {*} conf
 */
function startCache(conf) {
  client.createRedisClient(conf);
  orgConfigDefaults.setClient(client);
  orgConfigOverrides.setClient(client);
  repoConfigDefaults.setClient(client);
  repoConfigOverrides.setClient(client);
  systemQueues.setClient(client);
  repositoryBuilds.setClient(client);
  admin.setClient(client);
  notifications.setClient(client);
}

/**
 * stopCache
 */
async function stopCache() {
  await client.quit();
}

// Tasks

/**
 * fetchTasks
 */
async function fetchTasks() {
  const tasks = await client.fetchMembers("stampede-tasks");
  return tasks;
}

/**
 * fetchTaskConfig
 * @param {*} id
 * @return {Object} task config
 */
async function fetchTaskConfig(id) {
  const config = await client.fetch("stampede-tasks-" + id);
  return config;
}

/**
 * removeTaskConfig
 * @param {*} id
 */
async function removeTaskConfig(id) {
  await client.remove("stampede-" + id);
  await client.removeMember("stampede-tasks", id);
}

/**
 * removeAllTasks
 */
async function removeAllTasks() {
  const tasks = await client.fetchMembers("stampede-tasks");
  for (let index = 0; index < tasks.length; index++) {
    await client.remove("stampede-" + tasks[index]);
  }
  await client.remove("stampede-tasks");
}

/**
 * storeTask
 * @param {*} id
 */
async function storeTask(id) {
  await client.add("stampede-tasks", id);
}

/**
 * storeTaskConfig
 * @param {*} id
 * @param {*} config
 */
async function storeTaskConfig(id, config) {
  await client.store("stampede-tasks-" + id, config);
}

// Repo Config

/**
 * fetchRepoConfig
 * @param {*} owner
 * @param {*} repo
 * @return {Object} config
 */
async function fetchRepoConfig(owner, repo) {
  const config = await client.fetch(
    "stampede-" + owner + "-" + repo + "-config"
  );
  return config;
}

/**
 * storeRepoConfig
 * @param {*} owner
 * @param {*} repo
 * @param {*} config
 */
async function storeRepoConfig(owner, repo, config) {
  await client.store("stampede-" + owner + "-" + repo + "-config", config);
}

/**
 * removeRepoConfig
 * @param {*} owner
 * @param {*} repo
 */
async function removeRepoConfig(owner, repo) {
  await client.remove("stampede-" + owner + "-" + repo + "-config");
}

// System level config

/**
 * storeSystemDefaults
 * @param {*} defaults
 */
async function storeSystemDefaults(defaults) {
  await client.store("stampede-config-defaults", defaults);
}

/**
 * fetchSystemDefaults
 * @return {*} defaults
 */
async function fetchSystemDefaults() {
  const defaults = await client.fetch("stampede-config-defaults", {
    defaults: {},
  });
  return defaults;
}

/**
 * setSystemDefault
 * @param {*} name
 * @param {*} value
 */
async function setSystemDefault(name, value) {
  const defaults = await fetchSystemDefaults();
  defaults.defaults[name] = value;
  await storeSystemDefaults(defaults);
}

/**
 * removeSystemDefault
 * @param {*} name
 */
async function removeSystemDefault(name) {
  const defaults = await fetchSystemDefaults();
  defaults.defaults[name] = null;
  await storeSystemDefaults(defaults);
}

/**
 * storeSystemOverrides
 * @param {*} overrides
 */
async function storeSystemOverrides(overrides) {
  await client.store("stampede-config-overrides", overrides);
}

/**
 * fetchSystemOverrides
 * @return {*} overrides
 */
async function fetchSystemOverrides() {
  const overrides = await client.fetch("stampede-config-overrides", {
    overrides: {},
  });
  return overrides;
}

/**
 * setSystemOverride
 * @param {*} name
 * @param {*} value
 */
async function setSystemOverride(name, value) {
  const overrides = await fetchSystemOverrides();
  overrides.overrides[name] = value;
  await storeSystemOverrides(overrides);
}

/**
 * removeSystemOverride
 * @param {*} name
 */
async function removeSystemOverride(name) {
  const overrides = await fetchSystemOverrides();
  overrides.overrides[name] = null;
  await storeSystemOverrides(overrides);
}

// Builds

/**
 * incrementBuildNumber
 * @param {*} buildPath
 */
async function incrementBuildNumber(buildPath) {
  const buildNumber = await client.increment("stampede-" + buildPath);
  return buildNumber;
}

/**
 * fetchBuildNumber
 * @param {*} buildPath
 */
async function fetchBuildNumber(buildPath) {
  const buildNumber = await client.fetch("stampede-" + buildPath);
  return buildNumber;
}

/**
 * fetchActiveBuilds
 */
async function fetchActiveBuilds() {
  const builds = await client.fetchMembers("stampede-activebuilds", []);
  return builds;
}

/**
 * addBuildToActiveList
 * @param {*} build
 */
async function addBuildToActiveList(build) {
  await client.add("stampede-activebuilds", build);
}

/**
 * removeBuildFromActiveList
 * @param {*} build
 */
async function removeBuildFromActiveList(build) {
  await client.removeMember("stampede-activebuilds", build);
}

/**
 * Fetch active tasks
 * @param {*} build
 */
async function fetchActiveTasks(build) {
  const tasks = await client.fetchMembers("stampede-" + build, []);
  return tasks;
}

/**
 * addTaskToActiveList
 * @param {*} build
 * @param {*} task
 */
async function addTaskToActiveList(build, task) {
  await client.add("stampede-" + build, task);
}

/**
 * removeTaskFromActiveList
 * @param {*} build
 * @param {*} task
 */
async function removeTaskFromActiveList(build, task) {
  await client.removeMember("stampede-" + build, task);
}

/**
 * addTaskToPendingList
 * @param {*} parentTaskID
 * @param {*} task
 */
async function addTaskToPendingList(parentTaskID, task) {
  await client.add("stampede-" + parentTaskID, JSON.stringify(task));
}

/**
 * pendingTasks
 * @param {*} parentTaskID
 */
async function pendingTasks(parentTaskID) {
  const tasks = await client.fetchMembers("stampede-" + parentTaskID);
  const pending = [];
  if (tasks != null) {
    for (let index = 0; index < tasks.length; index++) {
      pending.push(JSON.parse(tasks[index]));
    }
  }
  return pending;
}

/**
 * removePendingList
 * @param {*} parentTaskID
 */
async function removePendingList(parentTaskID) {
  await client.remove("stampede-" + parentTaskID);
}

// Heartbeat

/**
 * storeWorkerHeartbeat
 * @param {*} heartbeat
 */
async function storeWorkerHeartbeat(heartbeat) {
  await client.add("stampede-activeworkers", heartbeat.workerID);
  await client.store("stampede-worker-" + heartbeat.workerID, heartbeat, 35);
}

/**
 * fetchActiveWorkers
 */
async function fetchActiveWorkers() {
  const activeWorkers = [];
  const workers = await client.fetchMembers("stampede-activeworkers", []);
  for (let index = 0; index < workers.length; index++) {
    const worker = await client.fetch("stampede-worker-" + workers[index]);
    if (worker != null) {
      activeWorkers.push(worker);
    } else {
      await client.removeMember("stampede-activeworkers", workers[index]);
    }
  }
  return activeWorkers;
}

/**
 * fetchOwners
 */
async function fetchOwners() {
  const owners = await client.fetchMembers("stampede-owners", []);
  return owners;
}

/**
 * removeOwner
 * @param {*} owner
 */
async function removeOwner(owner) {
  await client.removeMember("stampede-owners", owner);
}

/**
 * addOwner
 * @param {*} owner
 */
async function addOwner(owner) {
  await client.add("stampede-owners", owner);
}

// Private functions

// General
module.exports.startCache = startCache;
module.exports.stopCache = stopCache;

// Tasks
module.exports.fetchTasks = fetchTasks;
module.exports.fetchTaskConfig = fetchTaskConfig;
module.exports.removeTaskConfig = removeTaskConfig;
module.exports.storeTask = storeTask;
module.exports.storeTaskConfig = storeTaskConfig;
module.exports.removeAllTasks = removeAllTasks;

// Repo config
module.exports.fetchRepoConfig = fetchRepoConfig;
module.exports.storeRepoConfig = storeRepoConfig;
module.exports.removeRepoConfig = removeRepoConfig;

// System config
module.exports.storeSystemDefaults = storeSystemDefaults;
module.exports.setSystemDefault = setSystemDefault;
module.exports.removeSystemDefault = removeSystemDefault;
module.exports.storeSystemOverrides = storeSystemOverrides;
module.exports.fetchSystemDefaults = fetchSystemDefaults;
module.exports.fetchSystemOverrides = fetchSystemOverrides;
module.exports.setSystemOverride = setSystemOverride;
module.exports.removeSystemOverride = removeSystemOverride;

// Builds
module.exports.fetchBuildNumber = fetchBuildNumber;
module.exports.incrementBuildNumber = incrementBuildNumber;
module.exports.fetchActiveBuilds = fetchActiveBuilds;
module.exports.addBuildToActiveList = addBuildToActiveList;
module.exports.removeBuildFromActiveList = removeBuildFromActiveList;
module.exports.fetchActiveTasks = fetchActiveTasks;
module.exports.addTaskToActiveList = addTaskToActiveList;
module.exports.removeTaskFromActiveList = removeTaskFromActiveList;
module.exports.addTaskToPendingList = addTaskToPendingList;
module.exports.pendingTasks = pendingTasks;
module.exports.removePendingList = removePendingList;

// Heartbeat
module.exports.storeWorkerHeartbeat = storeWorkerHeartbeat;
module.exports.fetchActiveWorkers = fetchActiveWorkers;

// Owners
module.exports.fetchOwners = fetchOwners;
module.exports.removeOwner = removeOwner;
module.exports.addOwner = addOwner;

// Modules
module.exports.orgConfigDefaults = orgConfigDefaults;
module.exports.orgConfigOverrides = orgConfigOverrides;
module.exports.repoConfigDefaults = repoConfigDefaults;
module.exports.repoConfigOverrides = repoConfigOverrides;
module.exports.systemQueues = systemQueues;
module.exports.repositoryBuilds = repositoryBuilds;
module.exports.admin = admin;
module.exports.notifications = notifications;
