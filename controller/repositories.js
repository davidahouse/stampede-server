'use strict'
const { App } = require('@octokit/app')
const Octokit = require('@octokit/rest')

/**
 * handle repositories
 * @param {*} req 
 * @param {*} res 
 * @param {*} redisClient 
 * @param {*} path 
 */
async function handle(req, res, serverConf, redisClient, path) {
//  const repos = await redisClient.fetchMembers('stampede-orgs-' + req.query.org, [])
  const repos = await getAuthorizedRepositories(req, serverConf, req.query.org)
  res.render(path + 'repositories', {org: req.query.org, repos: repos})
}

/**
 * get an authorized octokit object for further github api calls
 * @param {*} req 
 * @param {*} serverConf 
 * @param {*} org
 */
async function getAuthorizedRepositories(req, serverConf, org) {
  const repos = []
  const app = new App({id: serverConf.githubAppID, 
      privateKey: serverConf.githubAppPEM,
      baseUrl: serverConf.githubHost})
  const jwt = app.getSignedJsonWebToken()
  
  const octokit = new Octokit({
      auth: 'Bearer ' + jwt,
      userAgent: 'octokit/rest.js v1.2.3',
      baseUrl: serverConf.githubHost,
      previews: ['machine-man'],
      log: {
      debug: () => {},
      info: () => {},
      warn: console.warn,
      error: console.error
      }
  })
  const installation = await octokit.apps.getOrgInstallation({
    org: org
  })
  console.dir(installation)
  const installID = installation.data.id
  const accessToken = await app.getInstallationAccessToken({
    installationId: installID
  })
  const authorizedOctokit = new Octokit({
    auth: 'token ' + accessToken,
    userAgent: 'octokit/rest.js v1.2.3',
    baseUrl: serverConf.githubHost,
    log: {
    debug: () => {},
    info: () => {},
    warn: console.warn,
    error: console.error
    }
  })
  const results = await authorizedOctokit.apps.listRepos()
  for (let rindex = 0; rindex < results.data.repositories.length; rindex++) {
    console.log(results.data.repositories[rindex].name)
    if (!repos.includes(results.data.repositories[rindex].name)) {
      repos.push(results.data.repositories[rindex].name)
    }
  }
  return repos
}

module.exports.handle = handle