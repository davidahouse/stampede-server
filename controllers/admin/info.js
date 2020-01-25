require('pkginfo')(module);

/**
 * handle tasks
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  res.render(path + 'admin/info', { version: module.exports.version });
}

module.exports.handle = handle;
