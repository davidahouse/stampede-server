const yaml = require("js-yaml");

/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const owner = req.body.owner;
  const repository = req.body.repository;
  await cache.orgConfigOverrides.removeOverrides(owner);
  res.writeHead(301, {
    Location:
      "/repositories/viewOrgConfigOverrides?owner=" +
      owner +
      "&repository=" +
      repository
  });
  res.end();
}

module.exports.handle = handle;
