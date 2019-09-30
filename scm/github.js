'use strict'

const LynnRequest = require('lynn-request')
const yaml = require('js-yaml')
const { App } = require('@octokit/app')
const Octokit = require('@octokit/rest')
const chalk = require('chalk')

/**
 * getAuthorizedOctokit
 * @param {*} owner
 * @param {*} repo
 * @param {*} serverConf
 * @return {*} authorized octokit object
 */
async function getAuthorizedOctokit(owner, repo, serverConf) {
  const app = new App({id: serverConf.githubAppID,
    privateKey: serverConf.githubAppPEM,
    baseUrl: serverConf.githubHost})
  const jwt = app.getSignedJsonWebToken()
  const octokit = new Octokit({
    auth: 'Bearer ' + jwt,
    userAgent: 'octokit/rest.js v1.2.3',
    baseUrl: serverConf.githubHost,
    log: {
      debug: () => {},
      info: () => {},
      warn: console.warn,
      error: console.error,
    },
  })
  console.log('--- getRepoInstallation')
  const installation = await octokit.apps.getRepoInstallation({
    owner, repo,
  })
  const installID = installation.data.id
  console.log('--- getInstallationAccessToken')
  const accessToken = await app.getInstallationAccessToken({
    installationId: installID,
  })
  const authorizedOctokit = new Octokit({
    auth: 'token ' + accessToken,
    userAgent: 'octokit/rest.js v1.2.3',
    baseUrl: serverConf.githubHost,
    log: {
      debug: () => {},
      info: () => {},
      warn: console.warn,
      error: console.error,
    },
  })
  return authorizedOctokit
}

/**
 * findRepoConfig
 * @param {*} owner
 * @param {*} repo
 * @param {*} stampedeFile
 * @param {*} sha
 * @param {*} serverConf
 */
async function findRepoConfig(owner, repo, stampedeFile, sha, serverConf) {
  try {
    const authorizedOctokit = await getAuthorizedOctokit(owner, repo, serverConf)
    const contents = await authorizedOctokit.repos.getContents({
      owner: owner,
      repo: repo,
      path: stampedeFile,
      ref: sha,
    })
    console.log(contents)
    if (contents != null) {
      const configFile = await downloadStampedeFile(contents.data.download_url, owner,
        repo, serverConf)
      if (configFile != null) {
        console.log(configFile.body)
        const stampedeConfig = yaml.safeLoad(configFile.body)
        if (stampedeConfig != null) {
          return stampedeConfig
        }
      }
    }
    return null
  } catch (e) {
    return null
  }
}

/**
 * downloadStampedeFile
 * @param {*} downloadURL
 * @param {*} serverConf
 */
async function downloadStampedeFile(downloadURL, owner, repo, serverConf) {
  const fileURL = url.parse(downloadURL)
  const token = await getBearerToken(owner, repo, serverConf)
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

/**
 * getBearerToken
 * @param {*} owner
 * @param {*} repo
 * @param {*} serverConf
 * @return {*} bearer token
 */
async function getBearerToken(owner, repo, serverConf) {
  const app = new App({id: serverConf.githubAppID,
    privateKey: serverConf.githubAppPEM,
    baseUrl: serverConf.githubHost})
  const jwt = app.getSignedJsonWebToken()
  const octokit = new Octokit({
    auth: 'Bearer ' + jwt,
    userAgent: 'octokit/rest.js v1.2.3',
    baseUrl: serverConf.githubHost,
    log: {
      debug: () => {},
      info: () => {},
      warn: console.warn,
      error: console.error,
    },
  })
  console.log('--- getRepoInstallation')
  const installation = await octokit.apps.getRepoInstallation({
    owner, repo,
  })
  const installID = installation.data.id
  console.log('--- getInstallationAccessToken')
  const accessToken = await app.getInstallationAccessToken({
    installationId: installID,
  })
  return accessToken
}

/**
 * createCheckRun
 * @param {*} check
 */
async function createCheckRun(owner, repo, taskTitle, head_sha, external_id, 
  started_at, serverConf) {
  const authorizedOctokit = await getAuthorizedOctokit(owner, repo, serverConf)
  const checkRun = await authorizedOctokit.checks.create({
    owner: owner,
    repo: repo,
    name: taskTitle,
    head_sha: head_sha,
    status: 'queued',
    external_id: external_id,
    started_at: started_at,
  })
  return checkRun
}

/**
 * getTagInfo
 * @param {*} owner
 * @param {*} repo
 * @param {*} ref
 */
async function getTagInfo(owner, repo, ref, serverConf) {
  const authorizedOctokit = await getAuthorizedOctokit(owner, repo, serverConf)
  const tagInfo = await authorizedOctokit.git.getRef({
    owner: owner,
    repo: repo,
    ref: ref,
  })
  return tagInfo
}

/**
 * updateCheck
 * @param {*} owner
 * @param {*} repo
 * @param {*} serverConf
 * @param {*} update
 */
async function updateCheck(owner, repo, serverConf, update) {
  const authorizedOctokit = await getAuthorizedOctokit(owner, repo, serverConf)
  await authorizedOctokit.checks.update(update).catch((error) => {
    console.log(chalk.red('Error updating check in Github: ' + error))
    update.output = {
      title: 'Task Results',
      summary: 'Error applying task results, contact your stampede admin.',
      text: '',
    }
    authorizedOctokit.checks.update(update)
  })
}

module.exports.findRepoConfig = findRepoConfig
module.exports.createCheckRun = createCheckRun
module.exports.updateCheck = updateCheck
module.exports.getTagInfo = getTagInfo
