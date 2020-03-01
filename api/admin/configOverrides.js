"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/admin/configOverrides";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const systemOverrides = await dependencies.cache.fetchSystemOverrides();
  let overrides = {};
  if (systemOverrides != null) {
    Object.keys(systemOverrides.overrides).forEach(function(key) {
      overrides[key] = systemOverrides.overrides[key].toString();
    });
  }
  res.send({ overrides: overrides });
}

module.exports.path = path;
module.exports.handle = handle;
