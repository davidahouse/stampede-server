'use strict'
const fs = require('fs')
const yaml = require('js-yaml')
const chalk = require('chalk')
const LynnRequest = require('lynn-request')
const url = require('url')
const auth = require('./auth')

/**
 * initialize
 * @param {*} conf
 * @param {*} cache
 */
async function initialize(conf, cache) {
  // If we have a local path, attempt to initialize our config from there
  if (conf.stampedeConfigPath != null) {
    if (fs.existsSync(conf.stampedeConfigPath + '/tasks.yaml')) {
      const tasks = yaml.safeLoad(fs.readFileSync(conf.stampedeConfigPath +
                                '/tasks.yaml'))
      cache.storeTaskConfig(tasks)
      console.log(chalk.green('--- Saved task list from tasks.yaml'))
    } else {
      cache.storeTaskConfig([])
    }

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
 * @param {*} octokit
 * @param {*} cache
 * @param {*} serverConf
 */
async function findRepoConfig(owner, repo, sha, stampedeFile, octokit, cache, serverConf) {
  // Now try to find the config needed to execute this run. We will look in two places:
  // 1) First we look in redis and if we find it here then we will use it because it represents
  // a config override by the admin.
  // 2) We look in the repo for a stampede file.
  let config = await cache.fetchRepoConfig(owner, repo)
  if (config == null) {
    console.log(chalk.green('--- No override found in redis, looking into the repo'))
    try {
      const contents = await octokit.repos.getContents({
        owner: owner,
        repo: repo,
        path: stampedeFile,
        ref: sha,
      })
      console.log(contents)
      if (contents != null) {
        const configFile = await downloadStampedeFile(contents.data.download_url, owner, repo, serverConf)
        if (configFile != null) {
          console.log(configFile.body)
          const stampedeConfig = yaml.safeLoad(configFile.body)
          if (stampedeConfig != null) {
            config = stampedeConfig
          }
        }
      }
    } catch (e) {
      return null
    }
  }
  return config
}

/**
 * downloadStampedeFile
 * @param {*} downloadURL
 * @param {*} serverConf
 */
async function downloadStampedeFile(downloadURL, owner, repo, serverConf) {
  const fileURL = url.parse(downloadURL)
  const token = await auth.getBearerToken(owner, repo, serverConf)
  return new Promise(resolve => {
    const request = {
      title: 'stampedeDownload',
      options: {
        protocol: fileURL.protocol,
        port: fileURL.port,
        method: 'GET',
        host: fileURL.hostname,
        path: fileURL.path,
        auth: 'token ' + token,
        headers: {
          'User-Agent': owner,
        },
      },
    }
    const runner = new LynnRequest(request)
    runner.execute(function(result) {
      resolve(result)
    })
  })
}

module.exports.initialize = initialize
module.exports.findRepoConfig = findRepoConfig
