'use strict'

const auth = require('../lib/auth')

/**
 * handle task update
 * @param {*} job
 * @param {*} conf
 * @param {*} cache
 */
async function handle(job, serverConf, cache) {
  console.log('--- taskUpdate:')
  const event = job.data
  console.dir(event)

  // TODO: Remove task from active task list
  // TODO: Check for completed build also
  // TODO: Send out some notifications on the above

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
