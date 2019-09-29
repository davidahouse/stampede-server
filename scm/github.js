'use strict'

const LynnRequest = require('lynn-request')

/**
 * getAuthorizedToken
 * @param {*} owner 
 * @param {*} repo 
 * @param {*} serverConf 
 */
async function getAuthorizedToken(owner, repo, serverConf) {

}

async function findRepoConfig(owner, repo, stampedeFile, sha, serverConf) {
    try {
        const contents = await octokit.repos.getContents({
            owner: owner,
            repo: repo,
            path: stampedeFile,
            ref: sha,
        })
        console.log(contents)
        if (contents != null) {
            const configFile = await downloadStampedeFile(contents.data.download_url, owner, repo, serverConf)
            if (configFile != null) {
                console.log(configFile.body)
                const stampedeConfig = yaml.safeLoad(configFile.body)
                if (stampedeConfig != null) {
                    return stampedeConfig
                }
            }
        }
        return null
    } catch (e) {
        return null
    }
}

/**
 * downloadStampedeFile
 * @param {*} downloadURL
 * @param {*} serverConf
 */
async function downloadStampedeFile(downloadURL, owner, repo, serverConf) {
    const fileURL = url.parse(downloadURL)
    const token = await auth.getBearerToken(owner, repo, serverConf)
    return new Promise(resolve => {
      const request = {
        title: 'stampedeDownload',
        options: {
          protocol: fileURL.protocol,
          port: fileURL.port,
          method: 'GET',
          host: fileURL.hostname,
          path: fileURL.path,
          auth: 'token ' + token,
          headers: {
            'User-Agent': owner,
          },
        },
      }
      const runner = new LynnRequest(request)
      runner.execute(function(result) {
        resolve(result)
      })
    })
}

/**
 * createCheckRun
 * @param {*} check 
 */
async function createCheckRun(check) {
    const checkRun = await octokit.checks.create({
        owner: owner,
        repo: repo,
        name: taskTitle,
        head_sha: sha,
        status: 'queued',
        external_id: external_id,
        started_at: started_at,
    })
    return checkRun
}

module.exports.getAuthorizedToken = getAuthorizedToken
module.exports.findRepoConfig = findRepoConfig
module.exports.createCheckRun = createCheckRun
