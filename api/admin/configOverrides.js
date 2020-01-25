"use strict";

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} serverConf
 * @param {*} cache
 * @param {*} db
 */
async function handle(req, res, serverConf, cache, db) {
  const systemOverrides = await cache.fetchSystemOverrides();
  let overrides = {};
  if (systemOverrides != null) {
    Object.keys(systemOverrides.overrides).forEach(function(key) {
      overrides[key] = systemOverrides.overrides[key].toString();
    });
  }
  res.send({ overrides: overrides });
}

module.exports.handle = handle;
