"use strict";

const build = require("./build");

/**
 */
async function execute(owner, repository, buildID, buildInfo, dependencies) {
  try {
    const buildDetails = {
      owner: owner,
      repo: repository
    };

    buildDetails.buildKey = buildID;
    buildDetails.sha = "latest";
    buildDetails.branch = buildInfo.branch;

    const scmDetails = {
      id: dependencies.serverConfig.scm,
      cloneURL: buildInfo.cloneURL,
      sshURL: buildInfo.sshURL,
      branch: {
        name: buildInfo.branch,
        sha: "latest"
      }
    };

    // This is the config that is usually in the .stampede.yaml or in the cache. Here
    // we should just re-create a config based on the type of build
    // requested and what was passed in.
    const taskList = buildInfo.tasks;
    const buildConfig = {
      config: {},
      tasks: taskList
    };

    const repoConfig = {
      config: {}
    };

    build.startBuild(
      buildDetails,
      dependencies.scm,
      scmDetails,
      repoConfig,
      buildConfig,
      taskList,
      [],
      dependencies.cache,
      dependencies.serverConfig,
      dependencies.db,
      dependencies.logger
    );
  } catch (e) {
    dependencies.logger.error(e);
  }
}

module.exports.execute = execute;
