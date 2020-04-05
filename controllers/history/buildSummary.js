/**
 * path this handler will serve
 */
function path() {
  return "/history/buildSummary";
}

/**
 * handle buildSummary
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const total = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const summary = {
    total: 0,
    totalDuration: 0.0,
    avgDuration: 0.0,
    minDuration: 99999.99,
    maxDuration: 0.0,
  };

  const builds = await dependencies.db.recentBuilds(
    "Last 12 hours",
    "All",
    "All"
  );
  const recentBuilds = builds.rows;
  for (let index = 0; index < recentBuilds.length; index++) {
    const ageInMs = Date.now() - recentBuilds[index].completed_at;
    const ageInHours = Math.round(ageInMs / 1000 / 60 / 60);
    total[total.length - 1 - ageInHours] =
      total[total.length - 1 - ageInHours] + 1;
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
        label: "Total",
        data: total,
        backgroundColor: "rgba(0, 255, 0, 0.6)",
      },
    ],
  };
  res.render(dependencies.viewsPath + "history/buildSummary", {
    owners: owners,
    data: data,
    summary: summary,
  });
}

module.exports.path = path;
module.exports.handle = handle;
