"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/repositories";
}

/**
 * handle activeBuilds
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const repositories = await dependencies.db.fetchRepositories();
  res.send(repositories != null ? repositories.rows : []);
}

module.exports.path = path;
module.exports.handle = handle;
