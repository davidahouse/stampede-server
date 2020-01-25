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
  const systemDefaults = await cache.fetchSystemDefaults();
  let defaults = {};
  if (systemDefaults != null) {
    Object.keys(systemDefaults.defaults).forEach(function(key) {
      defaults[key] = systemDefaults.defaults[key].toString();
    });
  }
  res.send({ defaults: defaults });
}

module.exports.handle = handle;
