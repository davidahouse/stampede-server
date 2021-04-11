"use strict";

/**
 * findRepoConfig
 * @param {*} owner
 * @param {*} repo
 * @param {*} sha
 * @param {*} scm
 * @param {*} cache
 * @param {*} serverConf
 */
async function findRepoConfig(
  owner,
  repo,
  sha,
  stampedeFile,
  scm,
  cache,
  serverConf
) {
  // Now try to find the config needed to execute this run. We will look in two places:
  // 1) First we look in redis and if we find it here then we will use it because it represents
  // a config override by the admin.
  // 2) We look in the repo for a stampede file.
  let config = await cache.fetchRepoConfig(owner, repo);
  if (config == null) {
    config = await scm.findRepoConfig(
      owner,
      repo,
      stampedeFile,
      sha,
      serverConf
    );
    if (config.error != null) {
      let storedError = {
        error: config.error,
        timestamp: new Date(),
      };
      cache.storeRepoParseError(owner, repo, storedError);
      return null;
    } else if (config.config != null) {
      return config.config;
    } else {
      return null;
    }
  }
  return config;
}

module.exports.findRepoConfig = findRepoConfig;
