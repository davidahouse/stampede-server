/**
 * handle index
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  let owner = req.query.owner;
  let repository = req.query.repository;

  res.render(path + "repositories/selectConfigSource", {
    owner: owner,
    repository: repository
  });
}

module.exports.handle = handle;
