const { App } = require('@octokit/app')
const Octokit = require('@octokit/rest')
const { request } = require("@octokit/request")
const chalk = require('chalk')
const yaml = require('js-yaml')

/**
 * handle github hook
 * @param {*} req 
 * @param {*} res 
 * @param {*} serverConf 
 * @param {*} redisClient 
 */
async function handle(req, res, serverConf, redisClient) {
    console.log(chalk.green('--- github hook: ' + req.headers['x-github-event']))
    if (req.headers['x-github-event'] === 'check_suite') {
      await handleCheckSuite(req, serverConf, redisClient)
    } else if (req.headers['x-github-event'] === 'check_run') {
      await handleCheckRun(req, serverConf, redisClient)
    } else if (req.headers['x-github-event'] === 'pull_request') {
      await handlePullRequest(req, serverConf, redisClient)
    }
    res.send({status: 'ok'})
}

/**
 * handleCheckSuite
 * @param {*} req
 * @param {*} serverConf
 * @param {*} redisClient
 */
async function handleCheckSuite(req, serverConf, redisClient) {
  if (req.body.check_suite.app.id === parseInt(serverConf.githubAppID)) {
    const octokit = await getAuthorizedOctokit(req, serverConf)
    console.log(chalk.green('--- suite action: ' + req.body.action))
    if (req.body.action === 'rerequested') {
      const fullName = req.body.repository.full_name
      const parts = fullName.split('/')
      const owner = parts[0]
      const repo = parts[1]
      const sha = req.body.check_run != null ? req.body.check_run.head_sha : req.body.check_suite.head_sha
      const pullRequests = req.body.check_suite != null ? req.body.check_suite.pull_requests : []
      for (let prindex = 0; prindex < pullRequests.length; prindex++) {
          await createCheckRun(req, owner, repo, sha, pullRequests[prindex], octokit, redisClient)
      }
    }
  }
}

/**
 * handleCheckRun
 * @param {*} req 
 * @param {*} serverConf 
 * @param {*} redisClient 
 */
async function handleCheckRun(req, serverConf, redisClient) {
  if (req.body.check_run.app.id === parseInt(serverConf.githubAppID)) {
    const octokit = await getAuthorizedOctokit(req, serverConf)
    console.log(chalk.green('--- run action: ' + req.body.action))
    if (req.body.action === 'created') {
      await queueCheckRun(req, serverConf, octokit, redisClient)
    } else if (req.body.action === 'rerequested') {
      const fullName = req.body.repository.full_name
      const parts = fullName.split('/')
      const owner = parts[0]
      const repo = parts[1]
      const sha = req.body.check_run != null ? req.body.check_run.head_sha : req.body.check_suite.head_sha
      const pullRequests = req.body.check_suite != null ? req.body.check_suite.pull_requests : []
      for (let prindex = 0; prindex < pullRequests.length; prindex++) {
          await createCheckRun(req, owner, repo, sha, pullRequests[prindex], octokit, redisClient)
      }
    }
  }
}

/**
 * handlePullRequest
 * @param {*} req 
 * @param {*} serverConf 
 * @param {*} redisClient 
 */
async function handlePullRequest(req, serverConf, redisClient) {
  if ((req.body.action === 'opened') || (req.body.action === 'reopened')) {
    const fullName = req.body.repository.full_name
    const parts = fullName.split('/')
    const owner = parts[0]
    const repo = parts[1]
    const sha = req.body.pull_request.head.sha
    const octokit = await getAuthorizedOctokit(req, serverConf)
    await createCheckRun(req, owner, repo, sha, req.body.pull_request, octokit, redisClient)
  }
}

/**
 * get an authorized octokit object for further github api calls
 * @param {*} req 
 * @param {*} serverConf 
 */
async function getAuthorizedOctokit(req, serverConf) {
        const fullName = req.body.repository.full_name
        const parts = fullName.split('/')
        const owner = parts[0]
        const repo = parts[1]
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
            error: console.error
            }
        })
        const installation = await octokit.apps.getRepoInstallation({
            owner, repo
        })
        const installID = installation.data.id
        const accessToken = await app.getInstallationAccessToken({
            installationId: installID
        })
        const authorizedOctokit = new Octokit({
            auth: 'token ' + accessToken,
            userAgent: 'octokit/rest.js v1.2.3',
            baseUrl: serverConf.githubHost,
            log: {
            debug: () => {},
            info: () => {},
            warn: console.warn,
            error: console.error
            }
        })
        return authorizedOctokit
}

/**
 * Create a check run
 * @param {*} req 
 * @param {*} serverConf 
 * @param {*} octokit 
 * @param {*} redisClient 
 */
async function createCheckRun(req, owner, repo, sha, pullRequest, octokit, redisClient) {
    console.log(chalk.green('--- Creating check run for ' + owner + ' ' + repo + ' PR ' + pullRequest.number))

    // Capture the org and repo in case we haven't seen it before
    await redisClient.add('stampede-orgs', owner)
    await redisClient.add('stampede-orgs-' + owner, repo)

    // Now try to find the config needed to execute this run. We will look in two places:
    // 1) First we look in redis and if we find it here then we will use it because it represents a config
    //    override by the admin.
    // 2) We look in the repo for a .stampede.yaml file.

    // Lookup task list for this repo and default to an empty list
    let taskList = await redisClient.fetch('stampede-' + owner + '-' + repo + '-pullrequest')
    if (taskList == null) {
      console.log(chalk.green('--- No override found in redis, looking into the repo'))
      const contents = await octokit.repos.getContents({
        owner: owner,
        repo: repo,
        path: '.stampede.yaml',
        ref: sha
      })
      console.log(contents)
      if (contents != null) {
        const stampedeConfig = yaml.safeLoad(taskListContents)
        if (stampedeConfig != null && stampedeConfig.pullrequest != null) {
          taskList = stampedeConfig.pullrequest
        }
      }
    }

    if (taskList == null) {
      console.log(chalk.red('--- Unable to determine task list, no found in Redis or the project. Unable to continue'))
      return
    }

    const buildPath = owner + '-' + repo + '-pullrequest-' + pullRequest.number
    console.log(chalk.green('--- Build path: ' + buildPath))

    // determine our build number
    const buildNumber = await redisClient.increment('stampede-' + buildPath)
    console.log(chalk.green('--- Created build number: ' + buildNumber))

    // create the build in redis
    const buildDetails = {
      githubEvent: req.body,
      owner: owner,
      repository: repo,
      sha: sha,
      pullRequest: pullRequest,
      build: buildNumber
    }
    await redisClient.store('stampede-' + buildPath + '-' + buildNumber, buildDetails)
      
    for (let index = 0; index < taskList.tasks.length; index++) {
      const task = taskList.tasks[index]
      const external_id = buildPath + '-' + buildNumber + '-' + task.id

      // create the github check
      octokit.checks.create({
          owner: owner,
          repo: repo,
          name: task.title,
          head_sha: sha,
          external_id: external_id
      })

      // TODO: Combine the shared config for all tasks along
      // with the config for this specific task
      const config = taskList.config

      // store the initial task details
      const taskDetails = {
        owner: owner,
        repository: repo,
        buildNumber: buildNumber,
        pullRequest: pullRequest,
        task: {
          id: task.id,
          config: config,
        },
        status: 'queued',
        external_id: external_id,
        clone_url: req.body.repository.clone_url,
      }
      console.log(chalk.green('--- Creating task: ' + task.id))
      await redisClient.store('stampede-' + external_id, taskDetails)
    }
}

/**
 * Queue check run
 * @param {*} req 
 * @param {*} serverConf 
 * @param {*} octokit 
 * @param {*} redisClient 
 */
async function queueCheckRun(req, serverConf, octokit, redisClient) {
  const fullName = req.body.repository.full_name
  const parts = fullName.split('/')
  const owner = parts[0]
  const repo = parts[1]
  const started_at = new Date()

  console.log(chalk.green('--- Updating check run to queued'))
  await octokit.checks.update({
      owner: owner,
      repo: repo,
      status: 'queued',
      check_run_id: req.body.check_run.id,
      started_at: started_at.toISOString()
  })

  console.log(chalk.green('--- Adding task to queue'))
  const taskDetails = await redisClient.fetch('stampede-' + req.body.check_run.external_id)
  if (taskDetails != null) {
    taskDetails.check_run_id = req.body.check_run.id
    await redisClient.rpush('stampede-' + taskDetails.task.id, JSON.stringify(taskDetails))
  } else {
    console.log(chalk.red('--- Error finding task details, unable to queue'))
  }
}

module.exports.handle = handle