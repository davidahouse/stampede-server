'use strict'

const { App } = require('@octokit/app')
const Octokit = require('@octokit/rest')

/**
 * get an authorized octokit object for further github api calls
 * @param {*} req
 * @param {*} serverConf
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

module.exports.getAuthorizedOctokit = getAuthorizedOctokit
