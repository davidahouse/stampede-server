"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/history/removeTaskDetails";
}

function method() {
  return "delete";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const buildID = req.query.buildID;
  await dependencies.db.removeTaskDetails(buildID);
  res.send({ status: "OK" });
}

module.exports.path = path;
module.exports.handle = handle;
module.exports.method = method;
