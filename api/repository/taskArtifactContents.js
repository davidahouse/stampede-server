"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/repository/taskArtifactContents";
}

/**
 * handle buildKeys
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const taskID = req.query.taskID
  const title = req.query.title

  const contents = await dependencies.db.fetchTaskContents(
    taskID,
    title
  );

  if (contents != null && contents.rows.length > 0) {
    res.send(contents.rows[0].contents)
  } else {
    res.send({})
  }
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "repository-taskArtifactContents",
      parameters: [
        {
          in: "query",
          name: "taskID",
          schema: {
            type: "string",
          },
        },
        {
          in: "query",
          name: "title",
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
