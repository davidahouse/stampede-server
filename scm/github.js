"use strict";

const axios = require('axios').default;
const yaml = require("js-yaml");
const { App } = require("@octokit/app");
const { Octokit } = require("@octokit/rest");
const url = require("url");

let systemLogger = null;

async function verifyCredentials(serverConf, logger) {
  systemLogger = logger;
  const app = new App({
    id: serverConf.githubAppID,
    privateKey: serverConf.githubAppPEM,
    baseUrl: serverConf.githubHost,
  });
  const jwt = app.getSignedJsonWebToken();
  const octokit = Octokit({
    auth: "Bearer " + jwt,
    userAgent: "octokit/rest.js v1.2.3",
    baseUrl: serverConf.githubHost,
    log: {
      debug: () => { },
      info: () => { },
      warn: console.warn,
      error: console.error,
    },
  });
  logger.verbose("Github connection verified");
}

/**
 * getAuthorizedOctokit
 * @param {*} owner
 * @param {*} repo
 * @param {*} serverConf
 * @return {*} authorized octokit object
 */
async function getAuthorizedOctokit(owner, repo, serverConf) {
  const app = new App({
    id: serverConf.githubAppID,
    privateKey: serverConf.githubAppPEM,
    baseUrl: serverConf.githubHost,
  });
  const jwt = app.getSignedJsonWebToken();
  const octokit = Octokit({
    auth: "Bearer " + jwt,
    userAgent: "octokit/rest.js v1.2.3",
    baseUrl: serverConf.githubHost,
    log: {
      debug: () => { },
      info: () => { },
      warn: console.warn,
      error: console.error,
    },
  });
  systemLogger.verbose("getRepoInstallation");
  const installation = await octokit.apps.getRepoInstallation({
    owner,
    repo,
  });
  const installID = installation.data.id;
  systemLogger.verbose("getInstallationAccessToken");
  const accessToken = await app.getInstallationAccessToken({
    installationId: installID,
  });
  const authorizedOctokit = Octokit({
    auth: "token " + accessToken,
    userAgent: "octokit/rest.js v1.2.3",
    baseUrl: serverConf.githubHost,
    log: {
      debug: () => { },
      info: () => { },
      warn: console.warn,
      error: console.error,
    },
  });
  return authorizedOctokit;
}

async function getAccessToken(owner, repo, serverConf) {
  systemLogger.verbose("Getting access token for " + owner + " " + repo);
  try {
    const app = new App({
      id: serverConf.githubAppID,
      privateKey: serverConf.githubAppPEM,
      baseUrl: serverConf.githubHost,
    });
    const jwt = app.getSignedJsonWebToken();
    const octokit = Octokit({
      auth: "Bearer " + jwt,
      userAgent: "octokit/rest.js v1.2.3",
      baseUrl: serverConf.githubHost,
      log: {
        debug: () => { },
        info: () => { },
        warn: console.warn,
        error: console.error,
      },
    });
    const installation = await octokit.apps.getRepoInstallation({
      owner,
      repo,
    });
    const installID = installation.data.id;
    const accessToken = await app.getInstallationAccessToken({
      installationId: installID,
    });
    systemLogger.verbose("Received access token: " + accessToken);
    return accessToken;
  } catch (e) {
    systemLogger.verbose("Error getting access token: " + e);
    return null;
  }
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
  try {
    const authorizedOctokit = await getAuthorizedOctokit(
      owner,
      repo,
      serverConf
    );
    systemLogger.verbose(
      "searching for stampede file " + stampedeFile + " with sha " + sha
    );
    const contents = await authorizedOctokit.repos.getContents({
      owner: owner,
      repo: repo,
      path: stampedeFile,
      ref: sha,
    });
    if (contents != null) {
      const configFile = await downloadStampedeFile(
        contents.data.download_url,
        owner,
        repo,
        serverConf
      );
      if (configFile != null) {
        systemLogger.verbose(configFile.body);
        try {
          const stampedeConfig = yaml.safeLoad(configFile.body);
          if (stampedeConfig != null) {
            return {
              config: stampedeConfig,
            };
          }
        } catch (e) {
          return { error: e };
        }
      }
    }
    return null;
  } catch (e) {
    systemLogger.verbose("exception trying to find config: " + e);
    return { error: e };
  }
}

/**
 * downloadStampedeFile
 * @param {*} downloadURL
 * @param {*} serverConf
 */
async function downloadStampedeFile(downloadURL, owner, repo, serverConf) {
  const token = await getBearerToken(owner, repo, serverConf);

  try {
    const result = await axios({
      method: 'get',
      url: downloadURL,
      headers: { 'User-Agent': owner, "Authorization": "token " + token }
    })
    return result.data
  } catch (error) {
    systemLogger.error("Error downloading stampede file: " + error)
  }
}

/**
 * getBearerToken
 * @param {*} owner
 * @param {*} repo
 * @param {*} serverConf
 * @return {*} bearer token
 */
async function getBearerToken(owner, repo, serverConf) {
  const app = new App({
    id: serverConf.githubAppID,
    privateKey: serverConf.githubAppPEM,
    baseUrl: serverConf.githubHost,
  });
  const jwt = app.getSignedJsonWebToken();
  const octokit = new Octokit({
    auth: "Bearer " + jwt,
    userAgent: "octokit/rest.js v1.2.3",
    baseUrl: serverConf.githubHost,
    log: {
      debug: () => { },
      info: () => { },
      warn: console.warn,
      error: console.error,
    },
  });
  systemLogger.verbose("getRepoInstallation");
  const installation = await octokit.apps.getRepoInstallation({
    owner,
    repo,
  });
  const installID = installation.data.id;
  systemLogger.verbose("getInstallationAccessToken");
  const accessToken = await app.getInstallationAccessToken({
    installationId: installID,
  });
  return accessToken;
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
  const authorizedOctokit = await getAuthorizedOctokit(owner, repo, serverConf);
  const checkRun = await authorizedOctokit.checks
    .create({
      owner: owner,
      repo: repo,
      name: taskTitle,
      head_sha: head_sha,
      status: "queued",
      external_id: external_id,
      started_at: started_at,
      details_url:
        serverConf.webURL + "/history/buildTaskDetails?taskID=" + external_id,
    })
    .catch((error) => {
      systemLogger.error("Error creating check run: " + error);
    });
  if (checkRun.data == null || checkRun.data.id == null) {
    systemLogger.error("Error receiving a check run id. Response was:");
    systemLogger.error(JSON.stringify(checkRun, null, 2));
  }
  return checkRun;
}

/**
 * getTagInfo
 * @param {*} owner
 * @param {*} repo
 * @param {*} ref
 */
async function getTagInfo(owner, repo, ref, serverConf) {
  const authorizedOctokit = await getAuthorizedOctokit(owner, repo, serverConf);
  const tagInfo = await authorizedOctokit.git.getRef({
    owner: owner,
    repo: repo,
    ref: ref,
  });
  return tagInfo;
}

/**
 * updateCheck
 * @param {*} owner
 * @param {*} repo
 * @param {*} serverConf
 * @param {*} update
 */
async function updateCheck(owner, repo, serverConf, update) {
  const authorizedOctokit = await getAuthorizedOctokit(owner, repo, serverConf);

  // Ensure text property can fit in github check
  if (
    update.output != null &&
    update.output.text != null &&
    update.output.text.length > 65535
  ) {
    update.output.text =
      "Text too large for GitHub check, contact your stampede admin.";
  }

  await authorizedOctokit.checks.update(update).catch((error) => {
    systemLogger.error("Error updating check in Github: " + error);
    if (update.output.summary != null) {
      systemLogger.error(
        "Summary text size is: " + update.output.summary.length
      );
    }
    if (update.output.text != null) {
      systemLogger.error("Text size is: " + update.output.text.length);
    }
    update.conclusion = "failure";
    update.output = {
      title: "Task Results",
      summary: "Error applying task results, contact your stampede admin.",
      text: "",
    };
    authorizedOctokit.checks.update(update);
  });
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
  let welcomeString =
    "### Welcome to the Stampede Continous Automation System!\n";
  if (buildKey != null) {
    welcomeString +=
      "Your check runs are starting and you can check on their status by clicking the link below:\n" +
      "[" +
      serverConf.webURL +
      "/history/buildDetails?buildID=" +
      buildKey +
      "](" +
      serverConf.webURL +
      "/history/buildDetails?buildID=" +
      buildKey +
      ")";
  } else {
    welcomeString +=
      "No tasks were found either in your .stampede.yaml file or the cached config.\n";
    welcomeString +=
      "Double check the syntax of your config as it might be invalid.\n";
  }

  let externalID = buildKey != null ? buildKey : "stampede";

  let actionsList = [];

  if (actions.length > 0) {
    welcomeString +=
      "\nSome additional tasks are available for you to execute. You can trigger them from one of the buttons above.\n";
  }

  for (let index = 0; index < actions.length; index++) {
    actionsList.push({
      label:
        actions[index].title != null
          ? actions[index].title.substring(0, 20)
          : actions[index].id.substring(0, 20),
      description:
        actions[index].description != null
          ? actions[index].description.substring(0, 30)
          : actions[index].id.substring(0, 30),
      identifier: index.toString(),
    });
  }

  const authorizedOctokit = await getAuthorizedOctokit(owner, repo, serverConf);
  systemLogger.verbose("Creating Stampede check run");
  const checkRun = await authorizedOctokit.checks.create({
    owner: owner,
    repo: repo,
    name: "Stampede Information",
    head_sha: head_sha,
    status: "completed",
    external_id: externalID,
    started_at: new Date(),
    completed_at: new Date(),
    conclusion: "neutral",
    output: {
      title: "Stampede Information",
      summary: welcomeString,
      text: "",
    },
    actions: actionsList,
  });
  return checkRun;
}

/**
 * commentOnPR
 * @param {*} owner
 * @param {*} repo
 * @param {*} prNumber
 * @param {*} serverConfig
 */
async function commentOnPR(owner, repo, prNumber, comment, serverConfig) {
  // Do the stuff to comment on this PR
  const authorizedOctokit = await getAuthorizedOctokit(
    owner,
    repo,
    serverConfig
  );

  // Find all comments on this PR to see if there is an existing comment we can update
  let commentID = null;
  const comments = await authorizedOctokit.issues.listComments({
    owner: owner,
    repo: repo,
    issue_number: prNumber,
  });

  if (comments != null && comments.data != null) {
    for (let index = 0; index < comments.data.length; index++) {
      if (
        comments.data[index].user.type === "Bot" &&
        comments.data[index].user.login.includes("stampede")
      ) {
        commentID = comments.data[index].id;
      }
    }
  }

  if (commentID == null) {
    const result = await authorizedOctokit.issues.createComment({
      owner: owner,
      repo: repo,
      issue_number: prNumber,
      body: comment,
    });
  } else {
    const result = await authorizedOctokit.issues.updateComment({
      owner: owner,
      repo: repo,
      comment_id: commentID,
      body: comment,
    });
  }
}

module.exports.verifyCredentials = verifyCredentials;
module.exports.findRepoConfig = findRepoConfig;
module.exports.createCheckRun = createCheckRun;
module.exports.updateCheck = updateCheck;
module.exports.getTagInfo = getTagInfo;
module.exports.createStampedeCheck = createStampedeCheck;
module.exports.getAccessToken = getAccessToken;
module.exports.commentOnPR = commentOnPR;
