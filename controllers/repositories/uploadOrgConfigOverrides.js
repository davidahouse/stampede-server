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

  const uploadData = req.files.uploadFile;
  const overrides = yaml.safeLoad(uploadData.data);
  if (overrides != null) {
    await cache.orgConfigOverrides.storeOverrides(owner, overrides);
  }

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
