"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/history/latestArtifact";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  let repository = req.query.repository
  let title = req.query.title
  let buildKeyFilter = "All";
  if (req.query.buildKey != null) {
    buildKeyFilter = req.query.buildKey;
  }
  let sourceFilter = "All";
  if (req.query.source != null) {
    sourceFilter = req.query.source;
  }

  const artifacts = await dependencies.db.fetchLatestArtifact(
    repository,
    title,
    buildKeyFilter,
    sourceFilter
  )

  if (artifacts != null) {
    res.send(artifacts.rows);
  } else {
    res.send([]);
  }
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "history-tasks",
      parameters: [],
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
