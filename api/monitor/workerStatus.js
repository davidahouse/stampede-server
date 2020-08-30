"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/monitor/workerStatus";
}

/**
 * handle workerStatus
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const activeWorkers = await dependencies.cache.fetchActiveWorkers();
  res.send(activeWorkers);
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "monitor-workerStatus",
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
