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
  const defaults = yaml.safeLoad(uploadData.data);
  if (defaults != null) {
    await cache.orgConfigDefaults.storeDefaults(owner, defaults);
  }

  res.writeHead(301, {
    Location:
      "/repositories/viewOrgConfigDefaults?owner=" +
      owner +
      "&repository=" +
      repository
  });
  res.end();
}

module.exports.handle = handle;
