"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/repository/activeBuilds";
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
  const activeBuilds = await dependencies.db.activeBuilds(owner, repository);

  const builds = [];
  if (activeBuilds != null) {
    for (let index = 0; index < activeBuilds.rows.length; index++) {
      const buildID = activeBuilds.rows[index].build_id;
      const buildDetails = await dependencies.db.fetchBuild(buildID);
      const tasks = await dependencies.db.fetchBuildTasks(buildID);
      builds.push({
        buildID: buildID,
        buildDetails:
          buildDetails != null && buildDetails.rows.length > 0
            ? buildDetails.rows[0]
            : {},
        tasks: tasks.rows,
      });
    }
  }
  res.send(builds);
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "repository-activeBuilds",
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
