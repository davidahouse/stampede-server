const { Pool } = require("pg");
const moment = require("moment");

let pool;
let systemLogger = null;
let createdTables = false;

/**
 * start
 * @param {*} conf
 */
async function start(conf, logger) {
  systemLogger = logger;
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
    if (createdTables === false) {
      createTables(client);
      createdTables = true;
    }
  });

  pool.on("error", (error, client) => {
    systemLogger.error("Database error: " + error);
  });
}

/**
 * stop the database connection
 */
async function stop() {
  await pool.end();
}

/**
 * storeRepository
 * @param {*} owner
 * @param {*} repository
 * @return {*} repository id
 */
async function storeRepository(owner, repository) {
  const insert =
    "INSERT INTO stampede.repositories (owner, repository) VALUES ($1, $2) ON CONFLICT DO NOTHING;";
  return await pool.query(insert, [owner, repository]);
}

/**
 * fetchRepositories
 */
async function fetchRepositories() {
  const query =
    "SELECT * FROM stampede.repositories ORDER BY owner, repository";
  return await pool.query(query);
}

/**
 * fetchOwners
 */
async function fetchOwners() {
  const query =
    "SELECT DISTINCT owner FROM stampede.repositories ORDER BY owner";
  return await pool.query(query);
}

/**
 * fetchRepositoriesWithOwner
 */
async function fetchRepositoriesWithOwner(owner) {
  const query =
    "SELECT * FROM stampede.repositories WHERE owner = $1 ORDER BY repository";
  return await pool.query(query, [owner]);
}

/**
 * storeBuildStart
 * @param {*} buildID
 * @param {*} owner
 * @param {*} repository
 * @param {*} buildKey
 * @param {*} build
 */
async function storeBuildStart(buildID, owner, repository, buildKey, build) {
  const insert =
    "INSERT INTO stampede.builds (build_id, owner, repository, build_key, build, status, started_at) \
    VALUES ($1, $2, $3, $4, $5, $6, $7);";
  return await pool.query(insert, [
    buildID,
    owner,
    repository,
    buildKey,
    build,
    "started",
    new Date(),
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
    return await pool.query(update, [
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
    return await pool.query(query, ["started", owner, repository]);
  } else if (owner != null) {
    const query =
      "SELECT * from stampede.builds where status = $1 \
    AND owner = $2";
    return await pool.query(query, ["started", owner]);
  } else {
    const query = "SELECT * from stampede.builds where status = $1";
    return await pool.query(query, ["started"]);
  }
}

/**
 * recentBuilds
 * @param {int} timeFilter
 * @param {int} buildKeyFilter
 * @param {string} repositoryFilter
 */
async function recentBuilds(timeFilter, buildKeyFilter, repositoryFilter) {
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
  query += " ORDER BY completed_at DESC";
  return await pool.query(query, queryParams);
}

/**
 * fetchBuild
 * @param {*} buildID
 */
async function fetchBuild(buildID) {
  const query = "SELECT * from stampede.builds where build_id = $1;";
  return await pool.query(query, [buildID]);
}

/**
 * fetchBuildTasks
 * @param {*} buildID
 */
async function fetchBuildTasks(buildID) {
  const query = "SELECT * from stampede.tasks where build_id = $1;";
  return await pool.query(query, [buildID]);
}

/**
 * fetchTask
 * @param {*} taskID
 */
async function fetchTask(taskID) {
  const query = "SELECT * from stampede.tasks where task_id = $1;";
  return await pool.query(query, [taskID]);
}

/**
 * fetchFailedTasks
 */
async function fetchFailedTasks() {
  const query =
    "SELECT * from stampede.tasks where conclusion = $1 ORDER BY completed_at DESC;";
  return await pool.query(query, ["failure"]);
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
  return await pool.query(query, [recent, "failure"]);
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
  return await pool.query(query, ["in_progress"]);
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
  return await pool.query(query, queryParams);
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
  return await pool.query(query, queryParams);
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
  return await pool.query(query, queryParams);
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
  return await pool.query(query, queryParams);
}

async function summarizeHourlyBuilds() {
  let query =
    "with hours as (select generate_series(date_trunc('hour', now()) - '23 hour'::interval, \
  date_trunc('hour', now()), '1 hour'::interval) as hour ) select hours.hour, count(builds.build_id) \
  from hours \
  left join stampede.builds on date_trunc('hour', started_at) = hours.hour group by 1 order by hour";
  return await pool.query(query);
}

async function summarizeHourlyTasks() {
  let query =
    "with hours as (select generate_series(date_trunc('hour', now()) - '23 hour'::interval, \
  date_trunc('hour', now()), '1 hour'::interval) as hour ) select hours.hour, count(tasks.task_id) \
  from hours \
  left join stampede.tasks on date_trunc('hour', started_at) = hours.hour group by 1 order by hour";
  return await pool.query(query);
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
  return await pool.query(query, queryParams);
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
  return await pool.query(insert, [taskID, buildID, task, status, queuedAt]);
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
  return await pool.query(update, [taskID, status, startedAt, node]);
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
  return await pool.query(update, [
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
  return await pool.query(insert, [taskID, details]);
}

/**
 * fetchTaskDetails
 * @param {*} taskID
 */
async function fetchTaskDetails(taskID) {
  const query =
    "SELECT details from stampede.taskDetails WHERE \
    task_id = $1;";
  return await pool.query(query, [taskID]);
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
  return await pool.query(update, [taskID, details]);
}

/**
 * fetchNodes
 */
async function fetchNodes() {
  const query = "SELECT DISTINCT node from stampede.tasks";
  return await pool.query(query);
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
  return await pool.query(query, ["completed", fromDate, toDate]);
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
  return await pool.query(query, ["completed", fromDate, toDate]);
}

/**
 * fetchRecentBuildKeys
 */
async function fetchRecentBuildKeys(timeFilter) {
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
    "SELECT DISTINCT build_key from stampede.builds WHERE \
    completed_at >= $1 AND \
    completed_at <= $2 \
    ORDER BY build_key";
  const queryParams = [fromDate, toDate];
  return await pool.query(query, queryParams);
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
  return await pool.query(query, queryParams);
}

async function repositorySummary() {
  let query =
    "select builds.owner, builds.repository, count(distinct builds.build_id) as buildCount,  \
  count(distinct tasks.task_id) as taskCount  \
  FROM stampede.builds, stampede.tasks \
  WHERE tasks.build_id = builds.build_id \
  GROUP BY builds.owner, builds.repository \
  ORDER BY builds.owner, builds.repository";
  return await pool.query(query);
}

async function removeRepositoryTaskDetails(owner, repository) {
  let query =
    "DELETE from stampede.taskDetails WHERE task_id in (select task_id from stampede.tasks where build_id in (select build_id from stampede.builds where owner = $1 \
AND repository = $2))";
  return await pool.query(query, [owner, repository]);
}

async function removeRepositoryTasks(owner, repository) {
  let query =
    "DELETE from stampede.tasks WHERE build_id in (select build_id from stampede.builds where owner = $1 \
AND repository = $2)";
  return await pool.query(query, [owner, repository]);
}

async function removeRepositoryBuilds(owner, repository) {
  let query =
    "DELETE from stampede.builds WHERE owner = $1 \
AND repository = $2";
  return await pool.query(query, [owner, repository]);
}

async function removeRepository(owner, repository) {
  let query =
    "DELETE from stampede.repositories WHERE owner = $1 \
  AND repository = $2";
  return await pool.query(query, [owner, repository]);
}

/**
 * createTables
 */
async function createTables(client) {
  systemLogger.info("Creating stampede database schema");

  client.query("CREATE SCHEMA IF NOT EXISTS stampede;");

  client.query(
    "CREATE TABLE IF NOT EXISTS stampede.repositories \
    (owner varchar, \
      repository varchar, \
    PRIMARY KEY (owner, repository));"
  );

  client.query(
    "CREATE TABLE IF NOT EXISTS stampede.builds \
    (build_id varchar, \
      owner varchar, \
      repository varchar, \
      build_key varchar, \
      build int, \
      status varchar, \
      started_at timestamptz, \
      completed_at timestamptz, \
    PRIMARY KEY (build_id));"
  );

  client.query(
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

  client.query(
    "CREATE TABLE IF NOT EXISTS stampede.taskDetails \
    (task_id varchar, \
      details jsonb, \
      PRIMARY KEY (task_id));"
  );

  client.query(
    "CREATE TABLE IF NOT EXISTS stampede.version \
    (version int);"
  );
  client.query("DELETE FROM stampede.version;");
  client.query("INSERT into stampede.version (version) VALUES (1);");
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

module.exports.fetchNodes = fetchNodes;

module.exports.fetchRecentBuildKeys = fetchRecentBuildKeys;
module.exports.fetchBuildTimePerOrg = fetchBuildTimePerOrg;
module.exports.fetchBuildTimePerNode = fetchBuildTimePerNode;

module.exports.taskHealth = taskHealth;
module.exports.repositorySummary = repositorySummary;

module.exports.removeRepositoryTaskDetails = removeRepositoryTaskDetails;
module.exports.removeRepositoryTasks = removeRepositoryTasks;
module.exports.removeRepositoryBuilds = removeRepositoryBuilds;
module.exports.removeRepository = removeRepository;
