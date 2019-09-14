'use strict'

const auth = require('../lib/auth')
const checkRun = require('../lib/checkRun')

/**
 * handle event
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 */
async function handle(req, serverConf, redisClient) {

  // Parse the incoming body into the parts we care about
  const event = parseEvent(req)
  console.log('--- CheckRunEvent:')
  console.dir(event)

  // Ignore check_suite events not for this app
  if (event.appID != parseInt(serverConf.githubAppID)) {
    return {status: 'ignored, not our app id'}
  }

  const octokit = await auth.getAuthorizedOctokit(event.owner, event.repo, serverConf)
  if (event.action === 'created') {
    await checkRun.queueCheckRun(event.owner, event.repo, event.checkRunID,
      event.externalID, octokit, redisClient)
  } else if (event.action === 'rerequested') {
    for (let index = 0; index < event.pullRequests.length; index++) {
      await checkRun.createCheckRun(event.owner, event.repo, event.sha,
        event.pullRequests[index], event.cloneURL,
        octokit, redisClient)
    }
  }
  return {status: 'check runs created'}
}

/**
 * parse body into an event object
 * @param {*} req
 * @return {object} event
 */
function parseEvent(req) {
  const fullName = req.body.repository.full_name
  const parts = fullName.split('/')
  const owner = parts[0]
  const repo = parts[1]
  return {
    appID: req.body.check_run.app.id,
    owner: owner,
    repo: repo,
    action: req.body.action,
    pullRequests: req.body.check_run.check_suite.pull_requests != null ?
      req.body.check_run.check_suite.pull_requests :
      [],
    sha: req.body.check_run.head_sha,
    cloneURL: req.body.repository.clone_url,
    checkRunID: req.body.check_run.id,
    externalID: req.body.check_run.external_id,
  }
}

module.exports.handle = handle
