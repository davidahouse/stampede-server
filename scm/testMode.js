'use strict'

const fs = require('fs')
const yaml = require('js-yaml')

/**
 * findRepoConfig
 * @param {*} owner
 * @param {*} repo
 * @param {*} stampedeFile
 * @param {*} sha
 * @param {*} serverConf
 */
async function findRepoConfig(owner, repo, stampedeFile, sha, serverConf) {
  if (serverConf.testModeRepoConfigPath != null) {
    const path = serverConf.testModeRepoConfigPath + owner + '/' + repo + '/.stampede.yaml'
    console.log('--- loading repo config: ' + path)
    const testModeConfigFile = fs.readFileSync(path)
    const config = yaml.safeLoad(testModeConfigFile)
    console.dir(config)
    return config
  } else {
    return null
  }
}

/**
 * createCheckRun
 * @param {*} check
 */
async function createCheckRun(owner, repo, taskTitle, head_sha, external_id,
  started_at, serverConf) {
  console.log('--- createCheckRun')
  return {
    data: {
      id: '123',
    },
  }
}

/**
 * getTagInfo
 * @param {*} owner
 * @param {*} repo
 * @param {*} ref
 */
async function getTagInfo(owner, repo, ref, serverConf) {
  return {
    data: {
      object: {
        sha: '123',
      },
    },
  }
}

/**
 * updateCheck
 * @param {*} owner
 * @param {*} repo
 * @param {*} serverConf
 * @param {*} update
 */
async function updateCheck(owner, repo, serverConf, update) {
  console.log('--- updateCheck')
}

module.exports.findRepoConfig = findRepoConfig
module.exports.createCheckRun = createCheckRun
module.exports.getTagInfo = getTagInfo
module.exports.updateCheck = updateCheck
