"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/admin/configDefaults";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const systemDefaults = await dependencies.cache.fetchSystemDefaults();
  let defaults = {};
  if (systemDefaults != null) {
    Object.keys(systemDefaults.defaults).forEach(function (key) {
      defaults[key] = systemDefaults.defaults[key].toString();
    });
  }
  res.send({ defaults: defaults });
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "admin-configDefaults",
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
