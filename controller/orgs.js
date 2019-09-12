const { App } = require('@octokit/app')
const Octokit = require('@octokit/rest')

/**
 * handle orgs
 * @param {*} req 
 * @param {*} res 
 * @param {*} redisClient 
 * @param {*} path 
 */
async function handle(req, res, serverConf, redisClient, path) {
  const orgs = await getAuthorizedOrgs(req, serverConf)
  res.render(path + 'orgs', {orgs: orgs})
}

/**
 * get an authorized octokit object for further github api calls
 * @param {*} req 
 * @param {*} serverConf 
 */
async function getAuthorizedOrgs(req, serverConf) {
  const orgs = []
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
  const installations = await octokit.apps.listInstallations()
  if (installations.data != null) {
    for (let index = 0; index < installations.data.length; index++) {
      if (installations.data[index].target_type === 'Organization') {
        const installID = installations.data[index].id
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
        const results = await authorizedOctokit.apps.listRepos()
        for (let rindex = 0; rindex < results.data.repositories.length; rindex++) {
          console.log(results.data.repositories[rindex].full_name)
          console.log(results.data.repositories[rindex].owner.login)
          if (!orgs.includes(results.data.repositories[rindex].owner.login)) {
            orgs.push(results.data.repositories[rindex].owner.login)
          }
        }
      }
    }
  }
  return orgs
}

module.exports.handle = handle