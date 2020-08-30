"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/repository/repositoryBuilds";
}

/**
 * handle recentBuilds
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const owner = req.query.owner;
  const repository = req.query.repository;

  const currentRepositoryBuilds = await dependencies.cache.repositoryBuilds.fetchRepositoryBuilds(
    owner,
    repository
  );
  const repositoryBuilds = [];

  // Now check repository builds and don't add any that are active
  for (let index = 0; index < currentRepositoryBuilds.length; index++) {
    const recentBuild = await dependencies.db.mostRecentBuild(
      owner,
      repository,
      currentRepositoryBuilds[index]
    );

    if (recentBuild.rows.length > 0) {
      repositoryBuilds.push({
        build: currentRepositoryBuilds[index],
        lastExecuted: recentBuild.rows[0].started_at,
      });
    } else {
      repositoryBuilds.push({
        build: currentRepositoryBuilds[index],
        lastExecuted: "",
      });
    }
  }

  const sortedBuilds = repositoryBuilds.sort(function (a, b) {
    if (a.build < b.build) {
      return -1;
    } else if (a.build > b.build) {
      return 1;
    } else {
      return 0;
    }
  });

  res.send(sortedBuilds);
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "repository-repositoryBuilds",
      parameters: [
        {
          in: "query",
          name: "owner",
          schema: {
            type: "string",
          },
        },
        {
          in: "query",
          name: "repository",
          schema: {
            type: "string",
          },
        },
      ],
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
