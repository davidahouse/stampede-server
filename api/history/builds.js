"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/history/builds";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {

  let timeFilter = "Last 8 hours";
  if (req.query.time != null) {
    timeFilter = req.query.time;
  }

  let buildKeyFilter = "All";
  if (req.query.buildKey != null) {
    buildKeyFilter = req.query.buildKey;
  }

  let repositoryFilter = "All";
  if (req.query.repository != null) {
    repositoryFilter = req.query.repository;
  }

  let sourceFilter = "All";
  if (req.query.source != null) {
    sourceFilter = req.query.source;
  }

  const builds = await dependencies.db.recentBuilds(
    timeFilter,
    buildKeyFilter,
    repositoryFilter,
    sourceFilter
  );
  if (builds != null) {
    res.send(builds.rows)
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
      summary: "history-builds",
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
