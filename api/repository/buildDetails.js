"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/repository/buildDetails";
}

/**
 * handle buildKeys
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const buildID = req.query.buildID
  const buildDetails = await dependencies.db.fetchBuild(buildID);
  const tasks = await dependencies.db.fetchBuildTasks(buildID);
  res.send({
    buildID: buildID,
    buildDetails:
      buildDetails != null && buildDetails.rows.length > 0
        ? buildDetails.rows[0]
        : {},
    tasks: tasks != null ? tasks.rows : [],
  });
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "repository-buildDetails",
      parameters: [
        {
          in: "query",
          name: "buildID",
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
