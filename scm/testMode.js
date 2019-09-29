'use strict'

/**
 * getAuthorizedToken
 * @param {*} owner 
 * @param {*} repo 
 * @param {*} serverConf 
 */
async function getAuthorizedToken(owner, repo, serverConf) {
    // nothing to do here, test mode is always authorized
    console.log('--- getAuthorizedToken')
}

/**
 * findRepoConfig
 * @param {*} owner 
 * @param {*} repo 
 * @param {*} stampedeFile 
 * @param {*} sha 
 * @param {*} serverConf 
 */
async function findRepoConfig(owner, repo, stampedeFile, sha, serverConf) {
    
}

/**
 * createCheckRun
 * @param {*} check 
 */
async function createCheckRun(check) {
    console.log('--- createCheckRun')
    console.dir(check)
    return {
        data: {
            id: "123"
        }
    }
}

module.exports.getAuthorizedToken = getAuthorizedToken
module.exports.findRepoConfig = findRepoConfig
module.exports.createCheckRun = createCheckRun
