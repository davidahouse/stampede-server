"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/history/archivedBuildWithTaskDetails";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const build = await dependencies.db.archivedBuildWithTaskDetails();
  let found = {};
  if (build.rows.length > 0) {
    found = build.rows[0];
  }
  res.send(found);
}

module.exports.path = path;
module.exports.handle = handle;
