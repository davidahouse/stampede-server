/**
 * path this handler will serve
 */
function path() {
  return "/artifacts/viewImageGallery";
}

/**
 * handle
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const taskRows = await dependencies.db.fetchTask(req.query.taskID);
  const task = taskRows.rows[0];
  const buildRows = await dependencies.db.fetchBuild(task.build_id);
  const build = buildRows.rows[0];
  const title = req.query.artifact;
  const contents = await dependencies.db.fetchTaskContents(
    req.query.taskID,
    title
  );

  let images = [];
  if (contents != null && contents.rows.length > 0) {
    images = contents.rows[0].contents.images;
  }

  res.render(dependencies.viewsPath + "artifacts/viewImageGallery", {
    owners: owners,
    isAdmin: req.validAdminSession,
    build: build,
    task: task,
    title: title,
    images: images,
  });
}

module.exports.path = path;
module.exports.handle = handle;
