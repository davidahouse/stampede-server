"use strict";

const fs = require("fs");
const yaml = require("js-yaml");

let systemLogger = null;

/**
 * verifyCredentials
 * @param {*} serverConf
 */
async function verifyCredentials(serverConf, logger) {
  systemLogger = logger;
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
  if (serverConf.testModeRepoConfigPath != null) {
    try {
      const path =
        serverConf.testModeRepoConfigPath +
        owner +
        "/" +
        repo +
        "/.stampede.yaml";
      systemLogger.verbose("loading repo config: " + path);
      const testModeConfigFile = fs.readFileSync(path);
      const config = yaml.safeLoad(testModeConfigFile);
      return config;
    } catch (e) {
      return {};
    }
  } else {
    return null;
  }
}

/**
 * createCheckRun
 * @param {*} check
 */
async function createCheckRun(
  owner,
  repo,
  taskTitle,
  head_sha,
  external_id,
  started_at,
  serverConf
) {
  systemLogger.verbose("createCheckRun");
  systemLogger.verbose("owner: " + owner);
  systemLogger.verbose("repo: " + repo);
  systemLogger.verbose("task: " + taskTitle);
  systemLogger.verbose("taskTitle: " + taskTitle);
  systemLogger.verbose("head_sha: " + head_sha);
  systemLogger.verbose("external_id: " + external_id);
  systemLogger.verbose("started_at: " + started_at);
  return {
    data: {
      id: "123",
    },
  };
}

/**
 * getTagInfo
 * @param {*} owner
 * @param {*} repo
 * @param {*} ref
 */
async function getTagInfo(owner, repo, ref, serverConf) {
  return {
    data: {
      object: {
        sha: "123",
      },
    },
  };
}

/**
 * updateCheck
 * @param {*} owner
 * @param {*} repo
 * @param {*} serverConf
 * @param {*} update
 */
async function updateCheck(owner, repo, serverConf, update) {
  systemLogger.verbose("updateCheck");
}

/**
 * createStampedeCheck
 */
async function createStampedeCheck(
  owner,
  repo,
  head_sha,
  buildKey,
  actions,
  serverConf
) {
  systemLogger.verbose("createStampedeCheck");
}

/**
 * getAccessToken
 * @param {*} owner
 * @param {*} repo
 * @param {*} serverConf
 */
async function getAccessToken(owner, repo, serverConf) {
  return "123456789101112";
}

/**
 * commentOnPR
 * @param {*} owner
 * @param {*} repo
 * @param {*} prNumber
 * @param {*} serverConfig
 */
async function commentOnPR(owner, repository, prNumber, comment, serverConfig) {
  // Do the stuff to comment on this PR
  systemLogger.info("commentOnPR:");
  systemLogger.info(`owner: ${owner}`);
  systemLogger.info(`repository: ${repository}`);
  systemLogger.info(`prNumber: ${prNumber}`);
  systemLogger.info(`comment: ${comment}`);
}

module.exports.verifyCredentials = verifyCredentials;
module.exports.findRepoConfig = findRepoConfig;
module.exports.createCheckRun = createCheckRun;
module.exports.getTagInfo = getTagInfo;
module.exports.updateCheck = updateCheck;
module.exports.createStampedeCheck = createStampedeCheck;
module.exports.getAccessToken = getAccessToken;
module.exports.commentOnPR = commentOnPR;
