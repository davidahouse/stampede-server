"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/repository/repositorySourceBuilds";
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
  const build_key = req.query.build_key;
  const recentBuilds = await dependencies.db.recentBuilds(
    "All",
    build_key,
    owner + "/" + repository,
    "All"
  );
  if (recentBuilds != null) {
    res.send(recentBuilds.rows);
  } else {
    res.send([])
  }
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "repository-repositorySourceBuilds",
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
        {
          in: "query",
          name: "source",
          schema: {
            type: "string"
          }
        }
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
