const prettyMilliseconds = require("pretty-ms");
const randomColor = require("randomcolor");

/**
 * path this handler will serve
 */
function path() {
  return "/history/buildTimeByNode";
}

/**
 * handle buildSummary
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  let timeFilter = "Last 8 hours";
  if (req.query.time != null) {
    timeFilter = req.query.time;
  }

  const total = [];
  const labels = [];
  const colors = [];

  const buildTime = await dependencies.db.fetchBuildTimePerNode(timeFilter);
  let totalms = 0;
  for (let index = 0; index < buildTime.rows.length; index++) {
    const rawSum = buildTime.rows[index].sum;
    const ms =
      (rawSum.milliseconds != null ? parseInt(rawSum.milliseconds) : 0) +
      (rawSum.seconds != null ? parseInt(rawSum.seconds) * 1000 : 0) +
      (rawSum.minutes != null ? parseInt(rawSum.minutes) * 1000 * 60 : 0) +
      (rawSum.hours != null ? parseInt(rawSum.hours) * 1000 * 60 * 60 : 0);
    totalms += ms;
    buildTime.rows[index].sum = ms;
  }

  for (let index = 0; index < buildTime.rows.length; index++) {
    labels.push(buildTime.rows[index].node);
    total.push(buildTime.rows[index].sum / totalms);
    colors.push(randomColor());
  }

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Build Time",
        data: total,
        backgroundColor: colors,
      },
    ],
  };
  res.render(dependencies.viewsPath + "history/buildTimeByNode", {
    owners: owners,
    isAdmin: req.validAdminSession,
    data: data,
    summary: buildTime.rows,
    timeFilter: timeFilter,
    timeFilterList: [
      "Last 8 hours",
      "Last 12 hours",
      "Today",
      "Yesterday",
      "Last 3 Days",
      "Last 7 Days",
      "Last 14 Days",
      "Last 30 Days",
    ],
    prettyMilliseconds: (ms) => (ms != null ? prettyMilliseconds(ms) : ""),
  });
}

module.exports.path = path;
module.exports.handle = handle;
