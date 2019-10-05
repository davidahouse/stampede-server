'use strict'

const chalk = require('chalk')

const build = require('./build')
const config = require('./config')

/**
 * Create a check run
 * @param {*} owner
 * @param {*} repo
 * @param {*} sha
 * @param {*} pullRequest
 * @param {*} cloneURL
 * @param {*} sshURL
 * @param {*} scm
 * @param {*} cache
 * @param {*} serverConf
 */
async function createCheckRun(owner, repo, sha, pullRequest, cloneURL, sshURL,
  scm, cache, serverConf) {
  console.log(chalk.green('--- Creating check run for ' + owner + ' ' +
                          repo + ' PR ' + pullRequest.number))

  const repoConfig = await config.findRepoConfig(owner, repo, sha, serverConf.stampedeFileName,
    scm, cache, serverConf)
  console.dir(repoConfig)
  if (repoConfig == null) {
    console.log(chalk.red('--- Unable to determine config, no found in Redis or the project. Unable to continue'))
    return
  }

  if (repoConfig.pullrequests == null || repoConfig.pullrequests.tasks == null) {
    console.log(chalk.red('--- Unable to find tasks. Unable to continue.'))
    return
  }

  console.dir(repoConfig.pullrequests)
  console.dir(repoConfig.pullrequests.tasks)
  if (repoConfig.pullrequests.tasks.length === 0) {
    console.log(chalk.red('--- Task list was empty. Unable to continue.'))
    return
  }

  const buildDetails = {
    owner: owner,
    repo: repo,
    sha: sha,
    pullRequest: pullRequest,
    buildKey: 'pullrequest-' + pullRequest.number,
  }

  const scmDetails = {
    id: serverConf.scm,
    cloneURL: cloneURL,
    sshURL: sshURL,
    pullRequest: pullRequest,
  }

  build.startBuild(buildDetails, scm, scmDetails, repoConfig, repoConfig.pullrequests,
    repoConfig.pullrequests.tasks, cache, serverConf)
}

module.exports.createCheckRun = createCheckRun
