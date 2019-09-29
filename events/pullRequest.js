'use strict'

const auth = require('../lib/auth')
const checkRun = require('../lib/checkRun')
const notification = require('../lib/notification')

/**
 * handle event
 * @param {*} req
 * @param {*} serverConf
 * @param {*} cache
 */
async function handle(req, serverConf, cache, scm) {

  // Parse the incoming body into the parts we care about
  const event = parseEvent(req)
  console.log('--- PullRequestEvent:')
  console.dir(event)
  notification.repositoryEventReceived('pull_request', event)

  if ((event.action === 'opened') || (event.action === 'reopened')) {
    await scm.getAuthorizedToken(event.owner, event.repo, serverConf)
//    const octokit = await auth.getAuthorizedOctokit(event.owner, event.repo, serverConf)
    await checkRun.createCheckRun(event.owner, event.repo, event.sha,
      event.pullRequest, event.cloneURL, event.sshURL,
      serverConf.stampedeFileName,
      scm, cache, serverConf)
    return {status: 'pull request tasks created'}
  } else {
    return {status: 'ignored, pull request not opened or reopened'}
  }
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
    owner: owner,
    repo: repo,
    action: req.body.action,
    pullRequest: req.body.pull_request,
    sha: req.body.pull_request.head.sha,
    cloneURL: req.body.repository.clone_url,
    sshURL: req.body.repository.ssh_url,
  }
}

module.exports.handle = handle
