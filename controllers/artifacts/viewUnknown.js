/**
 * path this handler will serve
 */
function path() {
  return "/artifacts/viewUnknown";
}

/**
 * handle buildDetails
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
  const contentRows = await dependencies.db.fetchTaskContents(
    req.query.taskID,
    title
  );

  let contents = "";
  if (contentRows != null && contentRows.rows.length > 0) {
    contents = JSON.stringify(contentRows.rows[0].contents, null, 2);
  }

  res.render(dependencies.viewsPath + "artifacts/viewUnknown", {
    owners: owners,
    isAdmin: req.validAdminSession,
    build: build,
    task: task,
    title: title,
    contents: contents,
  });
}

module.exports.path = path;
module.exports.handle = handle;
