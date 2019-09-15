'use strict'

const chalk = require('chalk')

const auth = require('../lib/auth')
const checkRun = require('../lib/checkRun')

/**
 * handle event
 * @param {*} req
 * @param {*} serverConf
 * @param {*} cache
 * @return {Object} response to the event
 */
async function handle(req, serverConf, cache) {

  // Parse the incoming body into the parts we care about
  const event = parseEvent(req)
  console.log(chalk.green('--- CheckSuiteEvent:'))
  console.dir(event)

  // Ignore check_suite events not for this app
  if (event.appID != parseInt(serverConf.githubAppID)) {
    return {status: 'ignored, not our app id'}
  }

  // Ignore actions we don't care about
  if (event.action != 'requested' && event.action != 'rerequested') {
    return {status: 'ignored, not an action we respond to'}
  }

  // Get an authorized octokit instance so we can create our check runs
  const octokit = await auth.getAuthorizedOctokit(event.owner, event.repo, serverConf)
  for (let index = 0; index < event.pullRequests.length; index++) {
    await checkRun.createCheckRun(event.owner, event.repo, event.sha,
      event.pullRequests[index], event.cloneURL,
      octokit, cache)
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
    appID: req.body.check_suite.app.id,
    owner: owner,
    repo: repo,
    action: req.body.action,
    pullRequests: req.body.check_suite.pull_requests != null ?
      req.body.check_suite.pull_requests :
      [],
    sha: req.body.check_suite.head_sha,
    cloneURL: req.body.repository.clone_url,
  }
}

module.exports.handle = handle
