"use strict";

const chalk = require("chalk");
const task = require("./task");
const build = require("./build");

/**
 * handle task execute
 * @param {*} job
 * @param {*} conf
 * @param {*} cache
 * @param {*} scm
 * @param {*} db
 */
async function handle(job, serverConf, cache, scm, db) {
  try {
    const buildDetails = {
      owner: job.owner,
      repo: job.repository
    };

    if (job.buildType === "Pull Request") {
      buildDetails.buildKey = "pullrequest-" + job.scmConfig.pullRequest.number;
      buildDetails.sha = job.scmConfig.pullRequest.head.sha;
      buildDetails.pullRequest = {
        number: job.scmConfig.pullRequest.number,
        title: job.scmConfig.pullRequest.title,
        head: {
          ref: job.scmConfig.pullRequest.head.ref,
          sha: job.scmConfig.pullRequest.head.sha
        },
        base: {
          ref: job.scmConfig.pullRequest.base.ref,
          sha: job.scmConfig.pullRequest.base.sha
        }
      };
    } else if (job.buildType === "Branch") {
      buildDetails.buildKey = job.scmConfig.branch.name;
      buildDetails.sha = job.scmConfig.branch.sha;
      buildDetails.branch = job.scmConfig.branch.name;
    } else if (job.buildType === "Release") {
      buildDetails.buildKey = job.scmConfig.release.name;
      buildDetails.sha = job.scmConfig.release.sha;
      buildDetails.release = job.scmConfig.release.name;
    }
    buildDetails.overrideTaskQueue = job.taskQueue;

    console.log("-- build details:");
    console.dir(buildDetails);

    const scmDetails = {
      id: "testMode",
      cloneURL: job.scmConfig.cloneURL,
      sshURL: job.scmConfig.sshURL
    };

    if (job.buildType === "Pull Request") {
      scmDetails.pullRequest = {
        number: job.scmConfig.pullRequest.number,
        title: job.scmConfig.pullRequest.title,
        head: {
          ref: job.scmConfig.pullRequest.head.ref,
          sha: job.scmConfig.pullRequest.head.sha
        },
        base: {
          ref: job.scmConfig.pullRequest.base.ref,
          sha: job.scmConfig.pullRequest.base.sha
        }
      };
    } else if (job.buildType === "Branch") {
      scmDetails.branch = job.scmConfig.branch;
    } else if (job.buildType === "Release") {
      scmDetails.release = job.scmConfig.release;
    }

    console.log("-- scm details:");
    console.dir(scmDetails);

    // This is the config that is usually in the .stampede.yaml or in the cache. Here
    // we should just re-create a config based on the type of build
    // requested and what was passed in.
    const taskList = [{ id: job.task.id, config: job.taskConfig }];
    const buildConfig = {
      config: {},
      tasks: taskList
    };

    const repoConfig = {
      config: {}
    };

    console.log("-- repoConfig:");
    console.dir(repoConfig);

    build.startBuild(
      buildDetails,
      scm,
      scmDetails,
      repoConfig,
      buildConfig,
      taskList,
      [],
      cache,
      serverConf,
      db
    );
  } catch (e) {
    console.log(chalk.red(e));
  }
}

module.exports.handle = handle;
