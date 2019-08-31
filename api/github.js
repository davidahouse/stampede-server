const { App } = require('@octokit/app')
const Octokit = require('@octokit/rest')
const { request } = require("@octokit/request")

async function handle(req, res, serverConf, redisClient) {
    console.log('--- github hook: ' + req.headers['x-github-event'])
    if (req.headers['x-github-event'] === 'check_suite') {
      if (req.body.check_suite.app.id === parseInt(serverConf.githubAppID)) {
        const octokit = await getAuthorizedOctokit(req, serverConf)
        console.log('--- suite action: ' + req.body.action)
        if (req.body.action === 'requested' || req.body.action === 'rerequested') {
            await createCheckRun(req, serverConf, octokit, redisClient)
        } else {
          console.log('--- ignoring, action not requested or rerequested')
        }
      } else {
        console.log('--- ignoring not for this app ' + req.body.check_suite.app.id)
      }
    } else if (req.headers['x-github-event'] === 'check_run') {
        if (req.body.check_run.app.id === parseInt(serverConf.githubAppID)) {
            const octokit = await getAuthorizedOctokit(req, serverConf)
            console.log('--- run action: ' + req.body.action)
            if (req.body.action === 'created') {
                await initiateCheckRun(req, serverConf, octokit)
            } else if (req.body.action === 'rerequested') {
                await createCheckRun(req, serverConf, octokit, redisClient)
            }
        } else {
          console.log('--- ignoring, app not ours ' + req.body.check_run.app.id)
        }
    }
    res.send({status: 'ok'})
}

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
        console.log('--- Getting installation id ', owner, repo)
        const installation = await octokit.apps.getRepoInstallation({
            owner, repo
        })
        const installID = installation.data.id

        console.log('--- Getting access token', installID)
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

async function createCheckRun(req, serverConf, octokit, redisClient) {
    const fullName = req.body.repository.full_name
    const parts = fullName.split('/')
    const owner = parts[0]
    const repo = parts[1]
    const sha = req.body.check_run != null ? req.body.check_run.head_sha : req.body.check_suite.head_sha
    const pullRequests = req.body.check_suite != null ? req.body.check_suite.pull_requests : []

    // Lookup task list for this repo
    const taskList = await redisClient.fetch('stampede-' + owner + '-' + repo + '-pullrequest')
    if (taskList != null) {
      console.dir(taskList)

      for (let prindex = 0; prindex < pullRequests.length; prindex++) {

        const buildPath = owner + '-' + repo + '-pullrequest-' + pullRequests[prindex].number
        console.log('--- buildPath: ' + buildPath)

        // determine our build number
        const buildNumber = await redisClient.increment('stampede-' + buildPath)
        console.log('--- build number: ' + buildNumber)

        // create the build in redis
        const buildDetails = {
          githubEvent: req.body,
          owner: owner,
          repository: repo,
          sha: sha,
          pullRequest: pullRequests[prindex],
          build: buildNumber
        }
        await redisClient.store('stampede-' + buildPath + '-' + buildNumber, buildDetails)
        
        for (let index = 0; index < taskList.tasks.length; index++) {
          const task = taskList.tasks[index]

          // create the github check
          octokit.checks.create({
              owner: owner,
              repo: repo,
              name: task.title,
              head_sha: sha,
          })

          // enqueue all the tasks
          const taskDetails = {
            build: buildDetails,
            task: task
          }
          await redisClient.store('stampede-' + buildPath + '-' + buildNumber + '-' + task.id, task)
          await redisClient.rpush('stampede-' + task.id, JSON.stringify(taskDetails))
        }
      }
    } else {
      console.log('--- no task list found for this repo')
    }

    // console.log('--- Creating check runs')
    // octokit.checks.create({
    //     owner: owner,
    //     repo: repo,
    //     name: '✅Unit Tests (iOS)',
    //     head_sha: sha,
    // })

    // octokit.checks.create({
    //   owner: owner,
    //   repo: repo,
    //   name: '⚠️Lint / Warnings',
    //   head_sha: sha,
    // })

    // octokit.checks.create({
    //   owner: owner,
    //   repo: repo,
    //   name: '📝PR Standards',
    //   head_sha: sha,
    // })
}

async function initiateCheckRun(req, serverConf, octokit) {
    const fullName = req.body.repository.full_name
    const parts = fullName.split('/')
    const owner = parts[0]
    const repo = parts[1]
    let status = 'in_progress'
    const started_at = new Date()

    console.log('--- Updating check run to in_progress')
    await octokit.checks.update({
        owner: owner,
        repo: repo,
        status: status,
        check_run_id: req.body.check_run.id,
        started_at: started_at.toISOString()
    })

    // Perform the checks here!
    console.log('--- Performing checks')
    const checks = await performChecks(req, serverConf, octokit)

    status = 'completed'
    const completed_at = new Date()
    console.log('--- Updating check run to completed')
    await octokit.checks.update({
        owner: owner,
        repo: repo,
        status: status,
        conclusion: checks.conclusion,
        output: {
            title: 'Task status',
            summary: checks.summary,
            text: checks.text
        },
        check_run_id: req.body.check_run.id,
        completed_at: completed_at.toISOString()
    })
}

async function performChecks(req, serverConf, octokit) {

    const fullName = req.body.repository.full_name
    const parts = fullName.split('/')
    const owner = parts[0]
    const repo = parts[1]
    const response = {
        conclusion: 'success',
        summary: '- ✅ Check was successful',
        text: '## Text\n- Here are some details\n- And more details'
    }
    return response
}

module.exports.handle = handle