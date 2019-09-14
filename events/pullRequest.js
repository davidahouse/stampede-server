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
  console.log('--- PullRequestEvent:')
  console.dir(event)

  if ((event.action === 'opened') || (event.action === 'reopened')) {
    const octokit = await auth.getAuthorizedOctokit(event.owner, event.repo, serverConf)
    await checkRun.createCheckRun(event.owner, event.repo, event.sha,
      event.pullRequest, event.cloneURL,
      octokit, redisClient)
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
    // TODO: sha is probably wrong here
    sha: req.body.check_run != null ? req.body.check_run.head_sha
      : req.body.check_suite.head_sha,
    cloneURL: req.body.repository.clone_url,
  }
}

module.exports.handle = handle
