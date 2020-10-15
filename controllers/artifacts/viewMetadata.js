const { metadata } = require("figlet");

/**
 * path this handler will serve
 */
function path() {
  return "/artifacts/viewMetadata";
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
  const contents = await dependencies.db.fetchArtifactMetadata(
    req.query.taskID,
    title
  );

  const metadata = [];
  if (contents != null && contents.rows.length > 0) {
    const rawData = contents.rows[0].metadata;
    console.dir(rawData);
    if (rawData != null) {
      Object.keys(rawData).forEach(function (key) {
        if (key != "hidden" && key != "system") {
          metadata.push({
            key: key,
            value: rawData[key],
          });
        }
      });
    }
  }

  res.render(dependencies.viewsPath + "artifacts/viewMetadata", {
    owners: owners,
    isAdmin: req.validAdminSession,
    build: build,
    task: task,
    title: title,
    metadata: metadata,
  });
}

module.exports.path = path;
module.exports.handle = handle;
