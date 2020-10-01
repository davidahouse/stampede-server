const { Pool } = require("pg");
const moment = require("moment");
const performance = require("perf_hooks").performance;

let pool;
let systemLogger = null;
let createdTables = false;
let logSlowQueries = "";
let logSQL = false;

/**
 * start
 * @param {*} conf
 */
async function start(conf, logger) {
  systemLogger = logger;
  logSlowQueries = conf.dbLogSlowQueries;
  logSQL = conf.dbLogSQL;
  if (conf.dbCert != null) {
    pool = new Pool({
      user: conf.dbUser,
      host: conf.dbHost,
      database: conf.dbDatabase,
      password: conf.dbPassword,
      port: conf.dbPort,
      ssl: {
        ca: conf.dbCert,
        rejectUnauthorized: false,
      },
    });
  } else {
    pool = new Pool({
      user: conf.dbUser,
      host: conf.dbHost,
      database: conf.dbDatabase,
      password: conf.dbPassword,
      port: conf.dbPort,
    });
  }

  pool.on("connect", (client) => {
    systemLogger.info("Database Connected");
  });

  pool.on("error", (error, client) => {
    systemLogger.error("Database error: " + error);
  });

  createTables(pool);
}

/**
 * stop the database connection
 */
async function stop() {
  await pool.end();
}

async function execute(operation, sql, params) {
  try {
    if (logSQL) {
      systemLogger.info("SQL: " + sql + " " + JSON.stringify(params, null, 2));
    }
    let start = performance.now();
    const result = await pool.query(sql, params);
    let finished = performance.now();
    if (
      (logSlowQueries === "true" && finished - start > 50.0) ||
      logSlowQueries === "all"
    ) {
      systemLogger.info("DB: " + operation + " " + (finished - start) + " ms");
    }
    return result;
  } catch (e) {
    systemLogger.error("DB Error: " + e);
    return null;
  }
}

/**
 * storeRepository
 * @param {*} owner
 * @param {*} repository
 */
async function storeRepository(owner, repository) {
  const insert =
    "INSERT INTO stampede.repositories (owner, repository) VALUES ($1, $2) ON CONFLICT DO NOTHING;";
  return await execute("storeRepository", insert, [owner, repository]);
}

/**
 * fetchRepositories
 */
async function fetchRepositories() {
  const query =
    "SELECT * FROM stampede.repositories ORDER BY owner, repository";
  return await execute("fetchRepositories", query, []);
}

/**
 * fetchOwners
 */
async function fetchOwners() {
  const query =
    "SELECT DISTINCT owner FROM stampede.repositories ORDER BY owner";
  return await execute("fetchOwners", query, []);
}

/**
 * fetchRepositoriesWithOwner
 */
async function fetchRepositoriesWithOwner(owner) {
  const query =
    "SELECT * FROM stampede.repositories WHERE owner = $1 ORDER BY repository";
  return await execute("fetchRepositoriesWithOwner", query, [owner]);
}

/**
 * storeBuildStart
 * @param {*} buildID
 * @param {*} owner
 * @param {*} repository
 * @param {*} buildKey
 * @param {*} build
 * @param {*} source
 */
async function storeBuildStart(
  buildID,
  owner,
  repository,
  buildKey,
  build,
  source
) {
  const insert =
    "INSERT INTO stampede.builds (build_id, owner, repository, build_key, build, status, started_at, source) \
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);";
  return await execute("storeBuildStart", insert, [
    buildID,
    owner,
    repository,
    buildKey,
    build,
    "started",
    new Date(),
    source,
  ]);
}

/**
 * storeBuildComplete
 * @param {*} buildID
 */
async function storeBuildComplete(buildID, status) {
  try {
    const update =
      "UPDATE stampede.builds set status = $2, completed_at = $3 \
    where build_id = $1;";
    return await execute("storeBuildComplete", update, [
      buildID,
      status != null ? status : "completed",
      new Date(),
    ]);
  } catch (e) {
    systemLogger.error("Error in storeBuildComplete: " + e);
  }
}

/**
 * activeBuilds
 */
async function activeBuilds(owner, repository) {
  if (owner != null && repository != null) {
    const query =
      "SELECT * from stampede.builds where status = $1 \
    AND owner = $2 AND repository = $3";
    return await execute("activeBuilds", query, ["started", owner, repository]);
  } else if (owner != null) {
    const query =
      "SELECT * from stampede.builds where status = $1 \
    AND owner = $2";
    return await execute("activeBuilds", query, ["started", owner]);
  } else {
    const query = "SELECT * from stampede.builds where status = $1";
    return await execute("activeBuilds", query, ["started"]);
  }
}

/**
 * recentBuilds
 * @param {string} timeFilter
 * @param {string} buildKeyFilter
 * @param {string} repositoryFilter
 * @param {string} sourceFilter
 */
async function recentBuilds(
  timeFilter,
  buildKeyFilter,
  repositoryFilter,
  sourceFilter
) {
  let fromDate = new Date();
  let toDate = new Date();
  if (timeFilter === "Last 8 hours") {
    fromDate.setHours(fromDate.getHours() - 8);
  } else if (timeFilter === "Last 12 hours") {
    fromDate.setHours(fromDate.getHours() - 12);
  } else if (timeFilter === "Today") {
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Yesterday") {
    fromDate = moment().subtract(1, "days").toDate();
    toDate = moment().subtract(1, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Last 3 Days") {
    fromDate = moment().subtract(3, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 7 Days") {
    fromDate = moment().subtract(7, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 14 Days") {
    fromDate = moment().subtract(14, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 30 Days") {
    fromDate = moment().subtract(30, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "This Month") {
    fromDate = moment().startOf("month").toDate();
  } else if (timeFilter === "Last Month") {
    fromDate = moment().startOf("month").subtract(1, "months").toDate();
    toDate = moment().endOf("month").subtract(1, "months").toDate();
  } else if (timeFilter === "2 Months Ago") {
    fromDate = moment().startOf("month").subtract(2, "months").toDate();
    toDate = moment().endOf("month").subtract(2, "months").toDate();
  } else if (timeFilter === "3 Months Ago") {
    fromDate = moment().startOf("month").subtract(3, "months").toDate();
    toDate = moment().endOf("month").subtract(3, "months").toDate();
  } else if (timeFilter === "4+ Months Ago") {
    fromDate = moment().startOf("month").subtract(12, "months").toDate();
    toDate = moment().endOf("month").subtract(4, "months").toDate();
  } else if (timeFilter === "All") {
    fromDate = new Date(0);
  }

  let query =
    "SELECT * FROM stampede.builds WHERE \
    completed_at >= $1 AND \
    completed_at <= $2 ";
  const queryParams = [fromDate, toDate];
  if (buildKeyFilter != "All") {
    query += " AND build_key = $" + (queryParams.length + 1);
    queryParams.push(buildKeyFilter);
  }
  if (repositoryFilter != "All") {
    query += " AND owner = $" + (queryParams.length + 1);
    query += " AND repository = $" + (queryParams.length + 2);
    queryParams.push(repositoryFilter.split("/")[0]);
    queryParams.push(repositoryFilter.split("/")[1]);
  }
  if (sourceFilter != "All") {
    query += " AND source = $" + (queryParams.length + 1);
    if (sourceFilter === "Pull Request") {
      queryParams.push("pull-request");
    } else if (sourceFilter === "Branch") {
      queryParams.push("branch-push");
    } else if (sourceFilter === "Release") {
      queryParams.push("release");
    } else if (sourceFilter === "Repository Build") {
      queryParams.push("repository-build");
    } else {
      queryParams.push(" ");
    }
  }
  query += " ORDER BY completed_at DESC";
  return await execute("recentBuilds", query, queryParams);
}

/**
 * fetchBuild
 * @param {*} buildID
 */
async function fetchBuild(buildID) {
  const query = "SELECT * from stampede.builds where build_id = $1;";
  return await execute("fetchBuild", query, [buildID]);
}

/**
 * fetchBuildTasks
 * @param {*} buildID
 */
async function fetchBuildTasks(buildID) {
  const query =
    "SELECT * from stampede.tasks where build_id = $1 order by queued_at;";
  return await execute("fetchBuildTasks", query, [buildID]);
}

/**
 * fetchTask
 * @param {*} taskID
 */
async function fetchTask(taskID) {
  const query = "SELECT * from stampede.tasks where task_id = $1;";
  return await execute("fetchTask", query, [taskID]);
}

/**
 * fetchFailedTasks
 */
async function fetchFailedTasks() {
  const query =
    "SELECT * from stampede.tasks where conclusion = $1 ORDER BY completed_at DESC;";
  return await execute("fetchFailedTasks", query, ["failure"]);
}

/**
 * fetchRecentFailedTasks
 */
async function fetchRecentFailedTasks() {
  const recent = new Date();
  recent.setHours(recent.getHours() - 2);
  const query =
    "SELECT task, count(*) FROM stampede.tasks \
    WHERE finished_at >= $1 AND \
    conclusion = $2 \
    GROUP BY task \
    ORDER BY task";
  return await execute("fetchRecentFailedTasks", query, [recent, "failure"]);
}

/**
 * activeTasks
 */
async function activeTasks() {
  const query =
    "SELECT * FROM stampede.builds, stampede.tasks \
      WHERE tasks.status = $1 AND \
      tasks.build_id = builds.build_id \
      ORDER BY tasks.started_at DESC";
  return await execute("activeTasks", query, ["in_progress"]);
}

/**
 * recentTasks
 * @param {string} timeFilter
 * @param {string} taskFilter
 * @param {string} repositoryFilter
 * @param {string} conclusionFilter
 * @param {string} nodeFilter
 * @param {string} sorted
 */
async function recentTasks(
  timeFilter,
  taskFilter,
  repositoryFilter,
  conclusionFilter,
  nodeFilter,
  sorted
) {
  let fromDate = new Date();
  let toDate = new Date();
  if (timeFilter === "Last 8 hours") {
    fromDate.setHours(fromDate.getHours() - 8);
  } else if (timeFilter === "Last 12 hours") {
    fromDate.setHours(fromDate.getHours() - 12);
  } else if (timeFilter === "Today") {
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Yesterday") {
    fromDate = moment().subtract(1, "days").toDate();
    toDate = moment().subtract(1, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Last 3 Days") {
    fromDate = moment().subtract(3, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 7 Days") {
    fromDate = moment().subtract(7, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 14 Days") {
    fromDate = moment().subtract(14, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 30 Days") {
    fromDate = moment().subtract(30, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  }

  let query =
    "SELECT * FROM stampede.builds, stampede.tasks \
    WHERE finished_at >= $1 AND \
    finished_at <= $2 ";
  const queryParams = [fromDate, toDate];
  if (taskFilter != "All") {
    query += " AND task = $" + (queryParams.length + 1);
    queryParams.push(taskFilter);
  }
  if (repositoryFilter != "All") {
    query += " AND owner = $" + (queryParams.length + 1);
    query += " AND repository = $" + (queryParams.length + 2);
    queryParams.push(repositoryFilter.split("/")[0]);
    queryParams.push(repositoryFilter.split("/")[1]);
  }
  if (conclusionFilter != "All") {
    query += " AND conclusion = $" + (queryParams.length + 1);
    queryParams.push(conclusionFilter);
  }
  if (nodeFilter != "All") {
    query += " AND node = $" + (queryParams.length + 1);
    queryParams.push(nodeFilter);
  }
  query += " AND tasks.build_id = builds.build_id ";
  if (sorted === "Date") {
    query += " ORDER BY finished_at";
  } else if (sorted === "Date DESC") {
    query += " ORDER BY finished_at DESC";
  } else if (sorted === "Task") {
    query += " ORDER BY task";
  } else if (sorted === "Owner") {
    query += " ORDER BY owner";
  } else if (sorted === "Repository") {
    query += " ORDER BY repository";
  } else if (sorted === "Conclusion") {
    query += " ORDER BY conclusion";
  }
  return await execute("recentTasks", query, queryParams);
}

async function countRecentTasks(timeFilter) {
  let fromDate = new Date();
  let toDate = new Date();
  if (timeFilter === "Last 8 hours") {
    fromDate.setHours(fromDate.getHours() - 8);
  } else if (timeFilter === "Last 12 hours") {
    fromDate.setHours(fromDate.getHours() - 12);
  } else if (timeFilter === "Today") {
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Yesterday") {
    fromDate = moment().subtract(1, "days").toDate();
    toDate = moment().subtract(1, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Last 3 Days") {
    fromDate = moment().subtract(3, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 7 Days") {
    fromDate = moment().subtract(7, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 14 Days") {
    fromDate = moment().subtract(14, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 30 Days") {
    fromDate = moment().subtract(30, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  }

  let query =
    "SELECT count(*) FROM stampede.tasks \
    WHERE started_at >= $1 AND \
    started_at <= $2 ";
  const queryParams = [fromDate, toDate];
  return await execute("countRecentTasks", query, queryParams);
}

async function summarizeRecentTasks() {
  let fromDate = new Date();
  fromDate = moment().subtract(30, "days").toDate();
  let toDate = new Date();
  toDate.setHours(23, 59, 59, 999);

  let query =
    "SELECT date(started_at), count(*) FROM stampede.tasks \
    WHERE started_at >= $1 AND \
    started_at <= $2 \
    GROUP BY date(started_at) \
    ORDER BY date(started_at)";
  const queryParams = [fromDate, toDate];
  return await execute("summarizeRecentTasks", query, queryParams);
}

async function summarizeRecentBuilds() {
  let fromDate = new Date();
  fromDate = moment().subtract(30, "days").toDate();
  let toDate = new Date();
  toDate.setHours(23, 59, 59, 999);

  let query =
    "SELECT date(started_at), count(*) FROM stampede.builds \
    WHERE started_at >= $1 AND \
    started_at <= $2 \
    GROUP BY date(started_at) \
    ORDER BY date(started_at)";
  const queryParams = [fromDate, toDate];
  return await execute("summarizeRecentBuilds", query, queryParams);
}

async function summarizeHourlyBuilds() {
  let query =
    "with hours as (select generate_series(date_trunc('hour', now()) - '23 hour'::interval, \
  date_trunc('hour', now()), '1 hour'::interval) as hour ) select hours.hour, count(builds.build_id) \
  from hours \
  left join stampede.builds on date_trunc('hour', started_at) = hours.hour group by 1 order by hour";
  return await execute("summarizeHourlyBuilds", query, []);
}

async function summarizeHourlyTasks() {
  let query =
    "with hours as (select generate_series(date_trunc('hour', now()) - '23 hour'::interval, \
  date_trunc('hour', now()), '1 hour'::interval) as hour ) select hours.hour, count(tasks.task_id) \
  from hours \
  left join stampede.tasks on date_trunc('hour', started_at) = hours.hour group by 1 order by hour";
  return await execute("summarizeHourlyTasks", query, []);
}

async function countRecentBuilds(timeFilter) {
  let fromDate = new Date();
  let toDate = new Date();
  if (timeFilter === "Last 8 hours") {
    fromDate.setHours(fromDate.getHours() - 8);
  } else if (timeFilter === "Today") {
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Yesterday") {
    fromDate = moment().subtract(1, "days").toDate();
    toDate = moment().subtract(1, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  }

  let query =
    "SELECT count(*) FROM stampede.builds \
    WHERE started_at >= $1 AND \
    started_at <= $2 ";
  const queryParams = [fromDate, toDate];
  return await execute("countRecentBuilds", query, queryParams);
}

/**
 * storeTaskStart
 * @param {*} taskID
 * @param {*} buildID
 * @param {*} task
 * @param {*} status
 * @param {*} queuedAt
 */
async function storeTaskStart(taskID, buildID, task, status, queuedAt) {
  const insert =
    "INSERT INTO stampede.tasks (task_id, build_id, task, \
    status, queued_at) \
    VALUES ($1, $2, $3, $4, $5);";
  return await execute("storeTaskStart", insert, [
    taskID,
    buildID,
    task,
    status,
    queuedAt,
  ]);
}

/**
 * storeTaskUpdate
 * @param {*} taskID
 * @param {*} status
 * @param {*} startedAt
 * @param {*} node
 */
async function storeTaskUpdate(taskID, status, startedAt, node) {
  const update =
    "UPDATE stampede.tasks set status = $2, started_at = $3, \
  node = $4 \
   where task_id = $1;";
  return await execute("storeTaskUpdate", update, [
    taskID,
    status,
    startedAt,
    node,
  ]);
}

/**
 * storeTaskCompleted
 * @param {*} taskID
 * @param {*} status
 * @param {*} finishedAt
 * @param {*} completedAt
 * @param {*} conclusion
 */
async function storeTaskCompleted(
  taskID,
  status,
  finishedAt,
  completedAt,
  conclusion
) {
  const update =
    "UPDATE stampede.tasks set status = $2, finished_at = $3, completed_at = $4, \
   conclusion = $5 \
   where task_id = $1;";
  return await execute("storeTaskCompleted", update, [
    taskID,
    status,
    finishedAt,
    completedAt,
    conclusion,
  ]);
}

/**
 * storeTaskDetails
 * @param {*} taskID
 * @param {*} details
 */
async function storeTaskDetails(taskID, details) {
  const insert =
    "INSERT INTO stampede.taskDetails (task_id, details) \
    VALUES ($1, $2);";
  return await execute("storeTaskDetails", insert, [taskID, details]);
}

/**
 * fetchTaskDetails
 * @param {*} taskID
 */
async function fetchTaskDetails(taskID) {
  const query =
    "SELECT details from stampede.taskDetails WHERE \
    task_id = $1;";
  return await execute("fetchTaskDetails", query, [taskID]);
}

/**
 * storeTaskDetailsUpdate
 * @param {*} taskID
 * @param {*} details
 */
async function storeTaskDetailsUpdate(taskID, details) {
  const update =
    "UPDATE stampede.taskDetails set details = $2 \
    WHERE task_id = $1;";
  return await execute("storeTaskDetailsUpdate", update, [taskID, details]);
}

/**
 * storeTaskArtifact
 */
async function storeTaskArtifact(taskID, title, type, url, contents, metadata) {
  const insert =
    "INSERT INTO stampede.taskArtifacts (task_id, title, type, url, created_at, contents, metadata) \
  VALUES ($1, $2, $3, $4, $5, $6, $7)";
  return await execute("storeTaskArtifacts", insert, [
    taskID,
    title,
    type,
    url,
    new Date(),
    contents,
    metadata,
  ]);
}

/**
 * fetchTaskArtifacts
 * @param {string} taskID
 */
async function fetchTaskArtifacts(taskID) {
  const query =
    "SELECT title, type, url, metadata from stampede.taskArtifacts WHERE \
  task_id = $1;";
  return await execute("fetchTaskArtifacts", query, [taskID]);
}

/**
 * fetchTaskContents
 * @param {*} taskID
 * @param {*} title
 */
async function fetchTaskContents(taskID, title) {
  const query =
    "SELECT contents from stampede.taskArtifacts WHERE task_id = $1 and title = $2";
  return await execute("fetchTaskContents", query, [taskID, title]);
}

/**
 * fetchNodes
 */
async function fetchNodes() {
  const query = "SELECT DISTINCT node from stampede.tasks";
  return await execute("fetchNodes", query, []);
}

/**
 * fetchBuildTimePerOrg
 * @param {*} timeFilter
 */
async function fetchBuildTimePerOrg(timeFilter) {
  let fromDate = new Date();
  let toDate = new Date();
  if (timeFilter === "Last 8 hours") {
    fromDate.setHours(fromDate.getHours() - 8);
  } else if (timeFilter === "Last 12 hours") {
    fromDate.setHours(fromDate.getHours() - 12);
  } else if (timeFilter === "Today") {
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Yesterday") {
    fromDate = moment().subtract(1, "days").toDate();
    toDate = moment().subtract(1, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Last 3 Days") {
    fromDate = moment().subtract(3, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 7 Days") {
    fromDate = moment().subtract(7, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 14 Days") {
    fromDate = moment().subtract(14, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 30 Days") {
    fromDate = moment().subtract(30, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  }

  const query =
    "SELECT builds.owner, sum(tasks.finished_at - tasks.started_at) \
  FROM stampede.tasks, stampede.builds \
  WHERE tasks.build_id = builds.build_id AND \
  tasks.status = $1 AND \
  tasks.started_at >= $2 AND \
  tasks.started_at <= $3 \
  GROUP BY builds.owner";
  return await execute("fetchBuildTimePerOrg", query, [
    "completed",
    fromDate,
    toDate,
  ]);
}

/**
 * fetchBuildTimePerNode
 * @param {*} timeFilter
 */
async function fetchBuildTimePerNode(timeFilter) {
  let fromDate = new Date();
  let toDate = new Date();
  if (timeFilter === "Last 8 hours") {
    fromDate.setHours(fromDate.getHours() - 8);
  } else if (timeFilter === "Last 12 hours") {
    fromDate.setHours(fromDate.getHours() - 12);
  } else if (timeFilter === "Today") {
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Yesterday") {
    fromDate = moment().subtract(1, "days").toDate();
    toDate = moment().subtract(1, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Last 3 Days") {
    fromDate = moment().subtract(3, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 7 Days") {
    fromDate = moment().subtract(7, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 14 Days") {
    fromDate = moment().subtract(14, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 30 Days") {
    fromDate = moment().subtract(30, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  }

  const query =
    "SELECT tasks.node, sum(tasks.finished_at - tasks.started_at) \
  FROM stampede.tasks \
  WHERE tasks.status = $1 AND \
  tasks.started_at >= $2 AND \
  tasks.started_at <= $3 \
  GROUP BY tasks.node";
  return await execute("fetchBuildTimePerNode", query, [
    "completed",
    fromDate,
    toDate,
  ]);
}

/**
 * fetchRecentBuildKeys
 */
async function fetchRecentBuildKeys(timeFilter, repositoryFilter) {
  let fromDate = new Date();
  let toDate = new Date();
  if (timeFilter === "Last 8 hours") {
    fromDate.setHours(fromDate.getHours() - 8);
  } else if (timeFilter === "Last 12 hours") {
    fromDate.setHours(fromDate.getHours() - 12);
  } else if (timeFilter === "Today") {
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Yesterday") {
    fromDate = moment().subtract(1, "days").toDate();
    toDate = moment().subtract(1, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Last 3 Days") {
    fromDate = moment().subtract(3, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 7 Days") {
    fromDate = moment().subtract(7, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 14 Days") {
    fromDate = moment().subtract(14, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 30 Days") {
    fromDate = moment().subtract(30, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  }
  const queryParams = [fromDate, toDate];

  let query =
    "SELECT DISTINCT build_key from stampede.builds WHERE \
    completed_at >= $1 AND \
    completed_at <= $2";

  if (repositoryFilter != "All") {
    query += " AND owner = $" + (queryParams.length + 1);
    query += " AND repository = $" + (queryParams.length + 2);
    queryParams.push(repositoryFilter.split("/")[0]);
    queryParams.push(repositoryFilter.split("/")[1]);
  }

  query += " ORDER BY build_key";
  return await execute("fetchRecentBuildKeys", query, queryParams);
}

/**
 * fetchBuildKeys
 * @param {*} owner
 * @param {*} repository
 * @param {*} source
 */
async function fetchBuildKeys(owner, repository, source) {
  let query = "";
  if (source === "branch-push") {
    query =
      "SELECT DISTINCT build_key from stampede.builds WHERE \
    owner = $1 AND \
    repository = $2 AND \
    source = $3 AND \
    archived is null \
    ORDER BY build_key";
  } else if (source === "pull-request") {
    query =
      "SELECT DISTINCT build_key from stampede.builds WHERE \
    owner = $1 AND \
    repository = $2 AND \
    source = $3 AND \
    archived is null \
    ORDER BY build_key DESC \
    LIMIT 50";
  } else if (source === "release") {
    query =
      "SELECT build_key FROM stampede.builds \
        WHERE owner = $1 AND \
        repository = $2 AND \
        source = $3 AND \
        archived is null \
        ORDER BY started_at DESC \
        LIMIT 10";
  }
  return await execute("fetchBuildKeys", query, [owner, repository, source]);
}

/**
 * taskHealth
 * @param {string} timeFilter
 * @param {string} repositoryFilter
 */
async function taskHealth(timeFilter, repositoryFilter) {
  let fromDate = new Date();
  let toDate = new Date();
  if (timeFilter === "Last 8 hours") {
    fromDate.setHours(fromDate.getHours() - 8);
  } else if (timeFilter === "Last 12 hours") {
    fromDate.setHours(fromDate.getHours() - 12);
  } else if (timeFilter === "Today") {
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Yesterday") {
    fromDate = moment().subtract(1, "days").toDate();
    toDate = moment().subtract(1, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
  } else if (timeFilter === "Last 3 Days") {
    fromDate = moment().subtract(3, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 7 Days") {
    fromDate = moment().subtract(7, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 14 Days") {
    fromDate = moment().subtract(14, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  } else if (timeFilter === "Last 30 Days") {
    fromDate = moment().subtract(30, "days").toDate();
    fromDate.setHours(0, 0, 0, 0);
  }

  let query =
    "SELECT stampede.tasks.task, stampede.tasks.conclusion, count(*) FROM stampede.builds, stampede.tasks \
    WHERE finished_at >= $1 AND \
    finished_at <= $2 ";
  const queryParams = [fromDate, toDate];
  if (repositoryFilter != "All") {
    query += " AND owner = $" + (queryParams.length + 1);
    query += " AND repository = $" + (queryParams.length + 2);
    queryParams.push(repositoryFilter.split("/")[0]);
    queryParams.push(repositoryFilter.split("/")[1]);
  }
  query += " AND tasks.build_id = builds.build_id ";
  query += " GROUP BY stampede.tasks.task, stampede.tasks.conclusion";
  query += " ORDER BY task";
  return await execute("taskHealth", query, queryParams);
}

async function repositorySummary() {
  let query =
    "select builds.owner, builds.repository, count(distinct builds.build_id) as buildCount,  \
  count(distinct tasks.task_id) as taskCount  \
  FROM stampede.builds, stampede.tasks \
  WHERE tasks.build_id = builds.build_id \
  GROUP BY builds.owner, builds.repository \
  ORDER BY builds.owner, builds.repository";
  return await execute("repositorySummary", query, []);
}

async function removeRepositoryTaskDetails(owner, repository) {
  let query =
    "DELETE from stampede.taskDetails WHERE task_id in (select task_id from stampede.tasks where build_id in (select build_id from stampede.builds where owner = $1 \
AND repository = $2))";
  return await execute("removeRepositoryTaskDetails", query, [
    owner,
    repository,
  ]);
}

async function removeRepositoryTasks(owner, repository) {
  let query =
    "DELETE from stampede.tasks WHERE build_id in (select build_id from stampede.builds where owner = $1 \
AND repository = $2)";
  return await execute("removeRepositoryTasks", query, [owner, repository]);
}

async function removeRepositoryBuilds(owner, repository) {
  let query =
    "DELETE from stampede.builds WHERE owner = $1 \
AND repository = $2";
  return await execute("removeRepositoryBuilds", query, [owner, repository]);
}

async function removeRepository(owner, repository) {
  let query =
    "DELETE from stampede.repositories WHERE owner = $1 \
  AND repository = $2";
  return await execute("removeRepository", query, [owner, repository]);
}

async function mostRecentBuild(owner, repository, build_key) {
  let query =
    "SELECT * from stampede.builds WHERE owner = $1 \
  AND repository = $2 \
  AND build_key = $3 \
  ORDER BY started_at DESC LIMIT 1";
  return await execute("mostRecentBuild", query, [
    owner,
    repository,
    build_key,
  ]);
}

async function removeBuild(build_id) {
  let deleteTaskDetails =
    "DELETE from stampede.taskDetails WHERE task_id in (select task_id from stampede.tasks where build_id = $1)";
  await execute("removeBuildDeleteTaskDetails", deleteTaskDetails, [build_id]);

  let deleteTasks = "DELETE from stampede.tasks WHERE build_id = $1";
  await execute("removeBuildDeleteTaskDetails", deleteTasks, [build_id]);

  let deleteBuild = "DELETE from stampede.builds WHERE build_id = $1";
  await execute("removeBuildDeleteBuild", deleteBuild, [build_id]);
}

async function archiveBuild(build_id) {
  let query = "UPDATE stampede.builds set archived = 'Y' WHERE build_id = $1";
  await execute("archiveBuild", query, [build_id]);
}

async function removeTaskDetails(build_id) {
  let deleteTaskDetails =
    "DELETE from stampede.taskDetails WHERE task_id in (select task_id from stampede.tasks where build_id = $1)";
  await execute("removeTaskDetails", deleteTaskDetails, [build_id]);
}

async function removeTaskArtifacts(build_id) {
  let deleteTaskArtifacts =
    "DELETE from stampede.taskArtifacts WHERE task_id in (select task_id from stampede.tasks where build_id = $1)";
  await execute("removeTaskArtifacts", deleteTaskArtifacts, [build_id]);
}

async function buildsForRetention(source, keepDays) {
  let keepDate = moment().subtract(keepDays, "days").toDate();
  let query =
    "SELECT * from stampede.builds WHERE source = $1 and completed_at < $2 and archived is null LIMIT 50";
  return await execute("buildsForRetention", query, [source, keepDate]);
}

async function archivedBuildWithTaskDetails() {
  let query =
    "SELECT * from stampede.builds WHERE \
    archived = 'Y' AND \
    build_id in (SELECT build_id FROM stampede.tasks WHERE task_id in (SELECT task_id from stampede.taskDetails)) \
    LIMIT 1";
  return await execute("archivedBuildWithTaskDetails", query, []);
}

/**
 * createTables
 */
async function createTables(client) {
  systemLogger.info("Creating stampede database schema if needed");

  await client.query("CREATE SCHEMA IF NOT EXISTS stampede;");

  await client.query(
    "CREATE TABLE IF NOT EXISTS stampede.repositories \
    (owner varchar, \
      repository varchar, \
    PRIMARY KEY (owner, repository));"
  );

  await client.query(
    "CREATE TABLE IF NOT EXISTS stampede.builds \
    (build_id varchar, \
      owner varchar, \
      repository varchar, \
      build_key varchar, \
      build int, \
      status varchar, \
      started_at timestamptz, \
      completed_at timestamptz, \
      source varchar, \
      archived varchar, \
    PRIMARY KEY (build_id));"
  );

  await client.query(
    "CREATE TABLE IF NOT EXISTS stampede.tasks \
    (task_id varchar, \
      build_id varchar, \
      task varchar, \
      status varchar, \
      conclusion varchar, \
      queued_at timestamptz, \
      started_at timestamptz, \
      finished_at timestamptz, \
      completed_at timestamptz, \
      node varchar, \
      PRIMARY KEY (task_id));"
  );

  await client.query(
    "CREATE TABLE IF NOT EXISTS stampede.taskDetails \
    (task_id varchar, \
      details jsonb, \
      PRIMARY KEY (task_id));"
  );

  await client.query(
    "CREATE TABLE IF NOT EXISTS stampede.taskArtifacts \
    (task_id varchar, \
      title varchar, \
      type varchar, \
      url varchar, \
      created_at timestamptz, \
      contents jsonb, \
      metadata jsonb, \
      PRIMARY KEY (task_id, title))"
  );

  await client.query(
    "CREATE TABLE IF NOT EXISTS stampede.version \
    (version int);"
  );

  await updateTables(client);
}

/**
 * updateTables
 * @param {*} client
 */
async function updateTables(client) {
  systemLogger.info("Checking for stampede database schema updates");
  let currentVersion = 0;
  const version = await execute(
    "selectVersion",
    "SELECT * FROM stampede.version",
    []
  );
  if (version.rows.length == 0) {
    await client.query("INSERT into stampede.version (version) VALUES (3);");
    return;
  }
  currentVersion = version.rows[0].version;

  while (currentVersion != 3) {
    systemLogger.info("Current schema version: " + currentVersion);
    if (currentVersion === 1) {
      systemLogger.info("Updating stampede database schema to version 2");
      await client.query(
        "ALTER TABLE stampede.builds ADD COLUMN source varchar;"
      );
      await client.query(
        "CREATE INDEX index_owner ON stampede.repositories (owner)"
      );
      await client.query(
        "CREATE INDEX index_ownrepostatus ON stampede.builds (owner, repository, status)"
      );
      await client.query(
        "CREATE INDEX index_ownreposource ON stampede.builds (owner, repository, source)"
      );
      await client.query("UPDATE stampede.version SET version = 2");
    } else if (currentVersion === 2) {
      systemLogger.info("Updating stampede database schema to version 3");
      await client.query(
        "ALTER TABLE stampede.builds ADD COLUMN archived varchar;"
      );
      await client.query("UPDATE stampede.version SET version = 3");
    }
    const version = await execute(
      "selectVersion",
      "SELECT * FROM stampede.version",
      []
    );
    currentVersion = version.rows[0].version;
  }
}

module.exports.start = start;
module.exports.stop = stop;
module.exports.storeRepository = storeRepository;
module.exports.fetchRepositories = fetchRepositories;
module.exports.fetchOwners = fetchOwners;
module.exports.fetchRepositoriesWithOwner = fetchRepositoriesWithOwner;

module.exports.storeBuildStart = storeBuildStart;
module.exports.storeBuildComplete = storeBuildComplete;
module.exports.activeBuilds = activeBuilds;
module.exports.recentBuilds = recentBuilds;
module.exports.fetchBuild = fetchBuild;

module.exports.fetchTask = fetchTask;
module.exports.storeTaskStart = storeTaskStart;
module.exports.storeTaskUpdate = storeTaskUpdate;
module.exports.storeTaskCompleted = storeTaskCompleted;
module.exports.fetchBuildTasks = fetchBuildTasks;
module.exports.fetchFailedTasks = fetchFailedTasks;
module.exports.activeTasks = activeTasks;
module.exports.recentTasks = recentTasks;
module.exports.fetchRecentFailedTasks = fetchRecentFailedTasks;
module.exports.countRecentTasks = countRecentTasks;
module.exports.countRecentBuilds = countRecentBuilds;
module.exports.summarizeRecentTasks = summarizeRecentTasks;
module.exports.summarizeRecentBuilds = summarizeRecentBuilds;
module.exports.summarizeHourlyBuilds = summarizeHourlyBuilds;
module.exports.summarizeHourlyTasks = summarizeHourlyTasks;

module.exports.storeTaskDetails = storeTaskDetails;
module.exports.storeTaskDetailsUpdate = storeTaskDetailsUpdate;
module.exports.fetchTaskDetails = fetchTaskDetails;

module.exports.storeTaskArtifact = storeTaskArtifact;
module.exports.fetchTaskArtifacts = fetchTaskArtifacts;
module.exports.fetchTaskContents = fetchTaskContents;

module.exports.fetchNodes = fetchNodes;

module.exports.fetchRecentBuildKeys = fetchRecentBuildKeys;
module.exports.fetchBuildKeys = fetchBuildKeys;
module.exports.fetchBuildTimePerOrg = fetchBuildTimePerOrg;
module.exports.fetchBuildTimePerNode = fetchBuildTimePerNode;

module.exports.taskHealth = taskHealth;
module.exports.repositorySummary = repositorySummary;

module.exports.removeRepositoryTaskDetails = removeRepositoryTaskDetails;
module.exports.removeRepositoryTasks = removeRepositoryTasks;
module.exports.removeRepositoryBuilds = removeRepositoryBuilds;
module.exports.removeRepository = removeRepository;
module.exports.mostRecentBuild = mostRecentBuild;
module.exports.removeBuild = removeBuild;
module.exports.buildsForRetention = buildsForRetention;
module.exports.archiveBuild = archiveBuild;
module.exports.removeTaskDetails = removeTaskDetails;
module.exports.removeTaskArtifacts = removeTaskArtifacts;
module.exports.archivedBuildWithTaskDetails = archivedBuildWithTaskDetails;
