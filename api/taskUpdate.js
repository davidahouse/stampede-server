'use strict'
const { App } = require('@octokit/app')
const Octokit = require('@octokit/rest')
const { request } = require('@octokit/request')

async function handle(req, res, serverConf, redisClient) {
  console.log('--- taskUpdate:')
  console.dir(req.body)
  if (req.body.external_id == null) {
    res.send({error: 'no external_id found'})
    return
  }
  const taskDetails = await redisClient.fetch('stampede-' + req.body.external_id)
  if (taskDetails.pullRequest == null) {
    console.log('--- Not a PR update, skipping')
    res.send({status: 'ok'})
    return
  }

  const owner = taskDetails.owner
  const repository = taskDetails.repository
  const buildNumber = taskDetails.buildNumber
  const prNumber = taskDetails.pullRequest.number
  const taskID = taskDetails.task.id
  const status = taskDetails.status
  const buildPath = owner + '-' + repository +
        '-pullrequest-' + prNumber
  const check_run_id = taskDetails.check_run_id

  console.log(owner)
  console.log(repository)
  console.log(buildNumber)
  console.log(prNumber)
  console.log(taskID)
  console.log(status)
  console.log(buildPath)
  console.log(check_run_id)

  const octokit = await getAuthorizedOctokit(req, owner, repository, serverConf)
  const update = {
    owner: owner,
    repo: repository,
    status: status,
    check_run_id: check_run_id,
  }

  if (taskDetails.conclusion != null) {
    update.conclusion = taskDetails.conclusion
    update.completed_at = new Date().toISOString()
  }

  if (taskDetails.output != null) {
    update.output = taskDetails.output
  }
  console.dir(update)
  console.log('--- updating check')
  await octokit.checks.update(update)
  res.send({status: 'ok'})
}

async function getAuthorizedOctokit(req, owner, repository, serverConf) {
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
  console.log('--- Getting installation id ', owner, repository)
  const installation = await octokit.apps.getRepoInstallation({
    owner: owner,
    repo: repository,
  })
  const installID = installation.data.id

  console.log('--- Getting access token', installID)
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

module.exports.handle = handle
