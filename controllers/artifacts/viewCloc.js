/**
 * path this handler will serve
 */
function path() {
  return "/artifacts/viewCloc";
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
  const contents = await dependencies.db.fetchTaskContents(
    req.query.taskID,
    title
  );

  loc = [];
  if (contents != null && contents.rows.length > 0) {
    const rawData = contents.rows[0].contents;
    Object.keys(rawData).forEach(function (key) {
      if (key != "SUM" && key != "header") {
        loc.push({
          language: key,
          code: rawData[key].code,
          blank: rawData[key].blank,
          nFiles: rawData[key].nFiles,
          comment: rawData[key].comment,
        });
      }
    });
  }

  const sortedLoc = loc.sort(function (a, b) {
    if (a.code > b.code) {
      return -1;
    } else if (a.code < b.code) {
      return 1;
    } else {
      return 0;
    }
  });

  res.render(dependencies.viewsPath + "artifacts/viewCloc", {
    owners: owners,
    isAdmin: req.validAdminSession,
    build: build,
    task: task,
    title: title,
    loc: sortedLoc,
  });
}

module.exports.path = path;
module.exports.handle = handle;
