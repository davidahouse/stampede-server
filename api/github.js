'use strict';
const chalk = require('chalk');
const eventLog = require('../lib/eventLog');

// Event handlers
const checkSuiteEvent = require('../events/checkSuite');
const checkRunEvent = require('../events/checkRun');
const pullRequestEvent = require('../events/pullRequest');
const pushEvent = require('../events/push');
const releaseEvent = require('../events/release');

/**
 * handle github hook
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 */
async function handle(req, res, serverConf, cache, scm) {
  console.log(chalk.green('--- github hook: ' + req.headers['x-github-event']));

  if (serverConf.logEventPath != null) {
    eventLog.save(
      {
        headers: req.headers,
        payload: req.body
      },
      serverConf.logEventPath
    );
  }

  let response = {};
  if (req.headers['x-github-event'] === 'check_suite') {
    response = await checkSuiteEvent.handle(req, serverConf, cache, scm);
  } else if (req.headers['x-github-event'] === 'check_run') {
    response = await checkRunEvent.handle(req, serverConf, cache, scm);
  } else if (req.headers['x-github-event'] === 'pull_request') {
    response = await pullRequestEvent.handle(req, serverConf, cache, scm);
  } else if (req.headers['x-github-event'] === 'push') {
    response = await pushEvent.handle(req, serverConf, cache, scm);
  } else if (req.headers['x-github-event'] === 'release') {
    response = await releaseEvent.handle(req, serverConf, cache, scm);
  }
  res.send(response);
}

module.exports.handle = handle;
