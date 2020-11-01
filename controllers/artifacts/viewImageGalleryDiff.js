/**
 * path this handler will serve
 */
function path() {
  return "/artifacts/viewImageGalleryDiff";
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

  let changedImages = [];
  let newImages = [];
  let removedImages = [];
  if (contents != null && contents.rows.length > 0) {
    changedImages = contents.rows[0].contents.changed;
    newImages = contents.rows[0].contents.new
    removedImages = contents.rows[0].contents.removed
  }

  res.render(dependencies.viewsPath + "artifacts/viewImageGalleryDiff", {
    owners: owners,
    isAdmin: req.validAdminSession,
    build: build,
    task: task,
    title: title,
    changedImages: changedImages,
    newImages: newImages,
    removedImages: removedImages
  });
}

module.exports.path = path;
module.exports.handle = handle;
