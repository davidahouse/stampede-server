'use strict'
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
    } else if (req.headers['x-github-event'] === 'push') {
      await handleBranchPush(req, serverConf, redisClient)
    } else if (req.headers['x-github-event'] === 'release') {
      await handleRelease(req, serverConf, redisClient)
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
    if (req.body.action === 'requested') {
      if (req.body.check_suite.pull_requests != null) {
        if (req.body.check_suite.pull_requests.length > 0) {
          const fullName = req.body.repository.full_name
          const parts = fullName.split('/')
          const owner = parts[0]
          const repo = parts[1]
          const sha = req.body.check_suite.head_sha
          const pullRequests = req.body.check_suite != null ? req.body.check_suite.pull_requests : []
          for (let prindex = 0; prindex < pullRequests.length; prindex++) {
            await createCheckRun(req, owner, repo, sha, pullRequests[prindex], octokit, redisClient)
          }
        }
      }
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
 * handleBranchPush
 * @param {*} req 
 * @param {*} serverConf 
 * @param {*} redisClient 
 */
async function handleBranchPush(req, serverConf, redisClient) {
  console.dir(req.body)
  if (req.body.created == false && req.body.deleted == false) {
    const fullName = req.body.repository.full_name
    const parts = fullName.split('/')
    const owner = parts[0]
    const repo = parts[1]
    const ref = req.body.ref.split('/')
    const branch = ref[ref.length-1]
    console.log('--- Got a branch push for ' + owner + '/' + repo + ' on branch ' + branch)
    const octokit = await getAuthorizedOctokit(req, serverConf)
    await createBranchRun(req, owner, repo, req.body.after, branch, octokit, redisClient)
  }
}

/**
 * handleBranchPush
 * @param {*} req 
 * @param {*} serverConf 
 * @param {*} redisClient 
 */
async function handleRelease(req, serverConf, redisClient) {
  const fullName = req.body.repository.full_name
  const parts = fullName.split('/')
  const owner = parts[0]
  const repo = parts[1]
  const release = req.body.release.name
  const tag = req.body.release.tag_name
  const octokit = await getAuthorizedOctokit(req, serverConf)
  await createReleaseRun(req, owner, repo, release, tag, octokit, redisClient)
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

  const config = await findRepoConfig(owner, repo, sha, octokit, redisClient)
  if (config == null) {
    console.log(chalk.red('--- Unable to determine config, no found in Redis or the project. Unable to continue'))
    return
  }

  console.dir(config.pullrequests)
  console.dir(config.pullrequests.tasks)
  if (config.pullrequests.tasks.length === 0) {
    console.log(chalk.red('--- Task list was empty. Unable to continue.'))
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
  await redisClient.add('stampede-activeBuilds', buildPath + '-' + buildNumber)
      
  // Now queue the tasks
  const tasks = config.pullrequests.tasks
  for (let index = 0; index < tasks.length; index++) {
    const task = tasks[index]
    const external_id = buildPath + '-' + buildNumber + '-' + task.id

    const taskInfo = await redisClient.fetch('stampede-tasks-' + task.id)
    
    // create the github check
    octokit.checks.create({
        owner: owner,
        repo: repo,
        name: taskInfo.title,
        head_sha: sha,
        external_id: external_id
    })

    // store the initial task details
    const taskDetails = {
      owner: owner,
      repository: repo,
      buildNumber: buildNumber,
      pullRequest: pullRequest,
      config: config.pullrequests,
      task: {
        id: task.id,
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
 * createBranchRun
 * @param {*} req 
 * @param {*} owner 
 * @param {*} repo 
 * @param {*} sha 
 * @param {*} branch 
 * @param {*} octokit 
 * @param {*} redisClient 
 */
async function createBranchRun(req, owner, repo, sha, branch, octokit, redisClient) {
  const config = await findRepoConfig(owner, repo, sha, octokit, redisClient)
  if (config == null) {
    console.log(chalk.red('--- Unable to determine config, no found in Redis or the project. Unable to continue'))
    return
  }

  if (config.branches == null) {
    console.log(chalk.red('--- No branch builds configured, unable to continue.'))
    return
  }

  console.dir(config.branches)
  for (let index = 0; index < config.branches.length; index++) {
    const branchConfig = config.branches[index]
    if (branchConfig.branch === branch) {

      if (branchConfig.tasks.length === 0) {
        console.log(chalk.red('--- Task list was empty. Unable to continue.'))
        return
      }
    
      const buildPath = owner + '-' + repo + '-' + branch
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
        branch: branch,
        build: buildNumber
      }
      await redisClient.store('stampede-' + buildPath + '-' + buildNumber, buildDetails)
      await redisClient.add('stampede-activeBuilds', buildPath + '-' + buildNumber)
          
      // Now queue the tasks
      const tasks = branchConfig.tasks
      for (let tindex = 0; tindex < tasks.length; tindex++) {
        const task = tasks[tindex]
    
        const external_id = buildPath + '-' + buildNumber + '-' + task.id
          
        // store the initial task details
        const taskDetails = {
          owner: owner,
          repository: repo,
          buildNumber: buildNumber,
          branch: branch,
          branch_sha: sha,
          config: branchConfig,
          task: {
            id: task.id,
          },
          status: 'queued',
          external_id: external_id,
          clone_url: req.body.repository.clone_url,
        }
        console.log(chalk.green('--- Creating task: ' + task.id))
        await redisClient.store('stampede-' + external_id, taskDetails)
        await redisClient.rpush('stampede-' + task.id, JSON.stringify(taskDetails))
      }
    }
  }
}

/**
 * createReleaseRun
 * @param {*} req 
 * @param {*} owner 
 * @param {*} repo 
 * @param {*} release
 * @param {*} octokit 
 * @param {*} redisClient 
 * 
 */
async function createReleaseRun(req, owner, repo, release, tag, octokit, redisClient) {
  // Find the sha for this release based on the tag
  console.log('--- Trying to find sha for ' + tag)
  const tagInfo = await octokit.git.getRef({
    owner: owner,
    repo: repo,
    ref: 'tags/' + tag
  })

  if (tagInfo.data.object == null || tagInfo.data.object.sha == null) {
    console.log(chalk.red('--- Unable to find sha for tag, unlable to continue'))
    return 
  }

  const sha = tagInfo.data.object.sha
  const config = await findRepoConfig(owner, repo, sha, octokit, redisClient)
  if (config == null) {
    console.log(chalk.red('--- Unable to determine config, no found in Redis or the project. Unable to continue'))
    return
  }

  if (config.releases == null) {
    console.log(chalk.red('--- No release builds configured, unable to continue.'))
    return
  }

  if (config.releases.tasks.length === 0) {
    console.log(chalk.red('--- Task list was empty. Unable to continue.'))
    return
  }

  const buildPath = owner + '-' + repo + '-' + release
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
    release: release,
    build: buildNumber
  }
  await redisClient.store('stampede-' + buildPath + '-' + buildNumber, buildDetails)
  await redisClient.add('stampede-activeBuilds', buildPath + '-' + buildNumber)
      
  // Now queue the tasks
  const tasks = config.releases.tasks
  for (let tindex = 0; tindex < tasks.length; tindex++) {
    const task = tasks[tindex]

    const external_id = buildPath + '-' + buildNumber + '-' + task.id
      
    // store the initial task details
    const taskDetails = {
      owner: owner,
      repository: repo,
      buildNumber: buildNumber,
      release: release,
      release_sha: sha,
      config: config.releases,
      task: {
        id: task.id,
      },
      status: 'queued',
      external_id: external_id,
      clone_url: req.body.repository.clone_url,
    }
    console.log(chalk.green('--- Creating task: ' + task.id))
    await redisClient.store('stampede-' + external_id, taskDetails)
    await redisClient.rpush('stampede-' + task.id, JSON.stringify(taskDetails))
  }
}

async function findRepoConfig(owner, repo, sha, octokit, redisClient) {
// Now try to find the config needed to execute this run. We will look in two places:
  // 1) First we look in redis and if we find it here then we will use it because it represents a config
  //    override by the admin.
  // 2) We look in the repo for a .stampede.yaml file.
  let config = await redisClient.fetch('stampede-' + owner + '-' + repo + '-config')  
  if (config == null) {
    console.log(chalk.green('--- No override found in redis, looking into the repo'))
    const contents = await octokit.repos.getContents({
      owner: owner,
      repo: repo,
      path: 'stampede.yaml',
      ref: sha
    })
    console.log(contents)
    if (contents != null) {
      const stampedeConfig = yaml.safeLoad(contents)
      if (stampedeConfig != null) {
        config = stampedeConfig
      }
    }
  }
  return config
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