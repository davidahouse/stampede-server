/**
 * path this handler will serve
 */
function path() {
  return "/admin/selectNewOwner";
}

/**
 * if the route requires admin
 */
function requiresAdmin() {
  return true;
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const allOwners = await dependencies.db.fetchOwners();
  const newOwners = [];
  for (let index = 0; index < allOwners.rows.length; index++) {
    if (!owners.includes(allOwners.rows[index].owner)) {
      newOwners.push(allOwners.rows[index].owner);
    }
  }
  res.render(dependencies.viewsPath + "admin/selectNewOwner", {
    owners: owners,
    newOwners: newOwners,
  });
}

module.exports.path = path;
module.exports.requiresAdmin = requiresAdmin;
module.exports.handle = handle;
