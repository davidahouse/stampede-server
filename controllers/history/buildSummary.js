/**
 * handle buildSummary
 * @param {*} req
 * @param {*} res
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 */
async function handle(req, res, cache, db, path) {
  const success = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const failure = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const summary = {
    total: 0,
    success: 0,
    failure: 0,
    totalDuration: 0.0,
    avgDuration: 0.0,
    minDuration: 99999.99,
    maxDuration: 0.0
  };

  const builds = await db.recentBuilds(12, 50);
  const recentBuilds = builds.rows;
  for (let index = 0; index < recentBuilds.length; index++) {
    const ageInMs = Date.now() - recentBuilds[index].completed_at;
    const ageInHours = Math.round(ageInMs / 1000 / 60 / 60);
    if (recentBuilds[index].status === "completed") {
      success[success.length - 1 - ageInHours] =
        success[success.length - 1 - ageInHours] + 1;
      summary.success = summary.success + 1;
    } else {
      failure[failure.length - 1 - ageInHours] =
        failure[failure.length - 1 - ageInHours] + 1;
      summary.failure = summary.failure + 1;
    }
    summary.total = summary.total + 1;
    summary.totalDuration = summary.totalDuration + ageInMs / 1000.0;
    summary.avgDuration = summary.totalDuration / summary.total;
    if (ageInMs > summary.maxDuration) {
      summary.maxDuration = ageInMs / 1000.0;
    }
    if (ageInMs / 1000.0 < summary.minDuration) {
      summary.minDuration = ageInMs / 1000.0;
    }
  }

  const data = {
    labels: ["11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "0"],
    datasets: [
      {
        label: "Sucess",
        data: success,
        backgroundColor: "rgba(0, 255, 0, 0.6)"
      },
      {
        label: "Failed",
        data: failure,
        backgroundColor: "rgba(255, 0, 0, 0.6)"
      }
    ]
  };
  res.render(path + "history/buildSummary", { data: data, summary: summary });
}

module.exports.handle = handle;
