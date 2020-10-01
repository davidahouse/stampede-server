/**
 * path this handler will serve
 */
function path() {
  return "/artifacts/viewXcodebuild";
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

  summary = {};
  tests = [];
  coverage = [];
  if (contents != null && contents.rows.length > 0) {
    const rawData = contents.rows[0].contents;
    if (rawData != null) {
      summary.allTests = rawData.allTests;
      summary.failedTests = rawData.failedTests;
      summary.successTests = rawData.successTests;
      summary.coverage =
        parseInt(rawData.codeCoverage.lineCoverage * 100) + "%";

      rawData.details.classes.forEach((classDetails) => {
        classDetails.testCases.forEach((testCase) => {
          tests.push({
            className: classDetails.className,
            testName: testCase.testName.replace("()", ""),
            status: testCase.status,
          });
        });
      });

      rawData.codeCoverage.targets.forEach((target) => {
        target.files.forEach((file) => {
          coverage.push({
            file: file.path,
            coverage: parseInt(file.lineCoverage * 100) + "%",
          });
        });
      });
    }
  }

  const sortedTests = tests.sort(function (a, b) {
    if (a.className < b.className) {
      return -1;
    } else if (a.className > b.className) {
      return 1;
    } else {
      if (a.testName < b.testName) {
        return -1;
      } else if (a.testName > b.testName) {
        return 1;
      } else {
        return 0;
      }
    }
  });

  const sortedCoverage = coverage.sort(function (a, b) {
    if (a.file < b.file) {
      return -1;
    } else if (a.file > b.file) {
      return 1;
    } else {
      return 0;
    }
  });

  res.render(dependencies.viewsPath + "artifacts/viewXcodebuild", {
    owners: owners,
    isAdmin: req.validAdminSession,
    build: build,
    task: task,
    title: title,
    summary: summary,
    tests: sortedTests,
    coverage: sortedCoverage,
  });
}

module.exports.path = path;
module.exports.handle = handle;
