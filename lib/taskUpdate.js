'use strict'

const auth = require('../lib/auth')

/**
 * handle task update
 * @param {*} job
 * @param {*} conf
 * @param {*} redisClient
 */
async function handle(job, serverConf, redisClient) {
  console.log('--- taskUpdate:')
  const event = job.data
  console.dir(event)

  if (event.checkRunID == null) {
    console.log('--- skipping since it is not a check update')
    return
  }

  const octokit = await auth.getAuthorizedOctokit(event.owner, event.repository, serverConf)
  const update = {
    owner: event.owner,
    repo: event.repository,
    status: event.status,
    check_run_id: event.checkRunID,
  }

  if (event.conclusion != null) {
    update.conclusion = event.conclusion
    update.completed_at = new Date().toISOString()
  }

  if (event.output != null) {
    update.output = event.output
  }
  console.dir(update)
  console.log('--- updating check')
  await octokit.checks.update(update)
}

module.exports.handle = handle
