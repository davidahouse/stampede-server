'use strict'
const fs = require('fs')
const yaml = require('js-yaml')
const chalk = require('chalk')

/**
 * initialize
 * @param {*} conf
 * @param {*} redisClient
 */
async function initialize(conf, redisClient) {
  // If we have a local path, attempt to initialize our config from there
  if (conf.stampedeConfigPath != null) {
    const tasks = yaml.safeLoad(fs.readFileSync(conf.stampedeConfigPath +
                                '/tasks.yaml'))
    for (let index = 0; index < tasks.length; index++) {
      await redisClient.add('stampede-tasks', tasks[index].id)
      await redisClient.store('stampede-tasks-' + tasks[index].id, tasks[index])
    }
  }
}

/**
 * findRepoConfig
 * @param {*} owner
 * @param {*} repo
 * @param {*} sha
 * @param {*} octokit
 * @param {*} redisClient
 */
async function findRepoConfig(owner, repo, sha, octokit, redisClient) {
  // Now try to find the config needed to execute this run. We will look in two places:
  // 1) First we look in redis and if we find it here then we will use it because it represents
  // a config override by the admin.
  // 2) We look in the repo for a .stampede.yaml file.
  let config = await redisClient.fetch('stampede-' + owner + '-' + repo + '-config')
  if (config == null) {
    console.log(chalk.green('--- No override found in redis, looking into the repo'))
    try {
      const contents = await octokit.repos.getContents({
        owner: owner,
        repo: repo,
        path: 'stampede.yaml',
        ref: sha,
      })
      console.log(contents)
      if (contents != null) {
        const stampedeConfig = yaml.safeLoad(contents)
        if (stampedeConfig != null) {
          config = stampedeConfig
        }
      }
    } catch (e) {
      return null
    }
  }
  return config
}

module.exports.initialize = initialize
module.exports.findRepoConfig = findRepoConfig
