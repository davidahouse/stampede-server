'use strict'
const fs = require('fs')
const yaml = require('js-yaml')
const chalk = require('chalk')

/**
 * initialize
 * @param {*} conf
 * @param {*} cache
 */
async function initialize(conf, cache) {
  // If we have a local path, attempt to initialize our config from there
  if (conf.stampedeConfigPath != null) {
    await initializeTasks(conf, cache)
    await initializeQueues(conf, cache)
    await initializeDefaults(conf, cache)
    await initializeOverrides(conf, cache)
  }
}

/**
 * initializeTasks
 * @param {*} conf
 * @param {*} cache
 */
async function initializeTasks(conf, cache) {
  await cache.removeTaskConfig()
  const tasksPath = conf.stampedeConfigPath + '/tasks'
  if (fs.existsSync(tasksPath)) {
    const files = fs.readdirSync(tasksPath).filter(function(file) {
      return file.endsWith('.yaml')
    })
    for (let index = 0; index < files.length; index++) {
      const taskDetails = yaml.safeLoad(fs.readFileSync(conf.stampedeConfigPath +
                              '/tasks/' + files[index]))
      if (taskDetails.id != null) {
        await cache.storeTask(taskDetails.id)
        await cache.storeTaskConfig(taskDetails.id, taskDetails)
      } else {
        console.log(chalk.red('Skipping ' + files[index] + ' as no task id found'))
      }
    }
  }
}

/**
 * initializeQueues
 * @param {*} conf
 * @param {*} cache
 */
async function initializeQueues(conf, cache) {
  if (fs.existsSync(conf.stampedeConfigPath + '/queues.yaml')) {
    const queues = yaml.safeLoad(fs.readFileSync(conf.stampedeConfigPath +
                              '/queues.yaml'))
    cache.storeSystemQueues(queues)
    console.log(chalk.green('--- Saved queues from queues.yaml'))
  } else {
    cache.storeSystemQueues({defaults: []})
  }
}

/**
 * initializeDefaults
 * @param {*} conf
 * @param {*} cache
 */
async function initializeDefaults(conf, cache) {
  if (fs.existsSync(conf.stampedeConfigPath + '/defaults.yaml')) {
    const defaults = yaml.safeLoad(fs.readFileSync(conf.stampedeConfigPath +
                              '/defaults.yaml'))
    cache.storeSystemDefaults(defaults)
    console.log(chalk.green('--- Saved config defaults from defaults.yaml'))
  } else {
    cache.storeSystemDefaults({defaults: []})
  }
}

/**
 * initializeOverrides
 * @param {*} conf
 * @param {*} cache
 */
async function initializeOverrides(conf, cache) {
  if (fs.existsSync(conf.stampedeConfigPath + '/overrides.yaml')) {
    const overrides = yaml.safeLoad(fs.readFileSync(conf.stampedeConfigPath +
                              '/overrides.yaml'))
    cache.storeSystemOverrides(overrides)
    console.log(chalk.green('--- Saved config overrides from overrides.yaml'))
  } else {
    cache.storeSystemOverrides({overrides: []})
  }
}

/**
 * findRepoConfig
 * @param {*} owner
 * @param {*} repo
 * @param {*} sha
 * @param {*} scm
 * @param {*} cache
 * @param {*} serverConf
 */
async function findRepoConfig(owner, repo, sha, stampedeFile, scm, cache, serverConf) {
  // Now try to find the config needed to execute this run. We will look in two places:
  // 1) First we look in redis and if we find it here then we will use it because it represents
  // a config override by the admin.
  // 2) We look in the repo for a stampede file.
  let config = await cache.fetchRepoConfig(owner, repo)
  if (config == null) {
    console.log(chalk.green('--- No override found in redis, looking into the repo'))
    config = await scm.findRepoConfig(owner, repo, stampedeFile, sha, serverConf)
  }
  return config
}

module.exports.initialize = initialize
module.exports.findRepoConfig = findRepoConfig
