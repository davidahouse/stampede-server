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

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "repositories",
      responses: {
        200: {
          description: "",
        },
      },
    },
  };
}

module.exports.path = path;
module.exports.handle = handle;
module.exports.docs = docs;
