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

    // if (fs.existsSync(conf.stampedeConfigPath + '/tasks.yaml')) {
    //   const tasks = yaml.safeLoad(fs.readFileSync(conf.stampedeConfigPath +
    //                             '/tasks.yaml'))
    //   cache.storeTaskConfig(tasks)
    //   console.log(chalk.green('--- Saved task list from tasks.yaml'))
    // } else {
    //   cache.storeTaskConfig([])
    // }

    if (fs.existsSync(conf.stampedeConfigPath + '/defaults.yaml')) {
      const defaults = yaml.safeLoad(fs.readFileSync(conf.stampedeConfigPath +
                                '/defaults.yaml'))
      cache.storeSystemDefaults(defaults)
      console.log(chalk.green('--- Saved config defaults from defaults.yaml'))
    } else {
      cache.storeSystemDefaults({defaults: []})
    }

    if (fs.existsSync(conf.stampedeConfigPath + '/overrides.yaml')) {
      const overrides = yaml.safeLoad(fs.readFileSync(conf.stampedeConfigPath +
                                '/overrides.yaml'))
      cache.storeSystemOverrides(overrides)
      console.log(chalk.green('--- Saved config overrides from overrides.yaml'))
    } else {
      cache.storeSystemOverrides({overrides: []})
    }
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
