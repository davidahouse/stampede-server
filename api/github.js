'use strict'
const chalk = require('chalk')

// Event handlers
const checkSuiteEvent = require('../events/checkSuite')
const checkRunEvent = require('../events/checkRun')
const pullRequestEvent = require('../events/pullRequest')
const pushEvent = require('../events/push')
const releaseEvent = require('../events/release')

/**
 * handle github hook
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 */
async function handle(req, res, serverConf, redisClient) {
  console.log(chalk.green('--- github hook: ' + req.headers['x-github-event']))
  let response = {}
  if (req.headers['x-github-event'] === 'check_suite') {
    response = await checkSuiteEvent.handle(req, serverConf, redisClient)
  } else if (req.headers['x-github-event'] === 'check_run') {
    response = await checkRunEvent.handle(req, serverConf, redisClient)
  } else if (req.headers['x-github-event'] === 'pull_request') {
    response = await pullRequestEvent.handle(req, serverConf, redisClient)
  } else if (req.headers['x-github-event'] === 'push') {
    response = await pushEvent.handle(req, serverConf, redisClient)
  } else if (req.headers['x-github-event'] === 'release') {
    response = await releaseEvent.handle(req, serverConf, redisClient)
  }
  res.send(response)
}

module.exports.handle = handle
