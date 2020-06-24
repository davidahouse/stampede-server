#!/usr/bin/env node
"use strict";
const clear = require("clear");
const figlet = require("figlet");
const fs = require("fs");
const cache = require("stampede-cache");
const os = require("os");
require("pkginfo")(module);
const viewsPath = __dirname + "/../views/";
const winston = require("winston");

// Internal modules
const web = require("../lib/web");
const taskQueue = require("../lib/taskQueue");
const taskUpdate = require("../lib/taskUpdate");
const notification = require("../lib/notification");
const db = require("../lib/db");
const repositoryBuild = require("../lib/repositoryBuild");

const fiveMinuteInterval = 1000 * 60 * 5;
const conf = require("rc")("stampede", {
  // redis
  redisHost: "localhost",
  redisPort: 6379,
  redisPassword: null,
  // web
  webURL: "http://localhost:7766",
  webPort: 7766,
  // Github
  githubAppID: 0,
  githubAppPEMPath: null,
  githubAppPEM: null,
  githubHost: null,
  // Postgres
  dbHost: "localhost",
  dbDatabase: "stampede",
  dbUser: "postgres",
  dbPassword: null,
  dbPort: 54320,
  dbCert: null,
  dbLogSlowQueries: "",
  // Misc
  responseQueue: "response",
  notificationQueues: "",
  stampedeFileName: ".stampede.yaml",
  scm: "github",
  // Debug assist properties
  logEventPath: null,
  testModeRepoConfigPath: null,
  // Admin mode
  adminPassword: "stampede",
  // Logging
  logLevel: "info",
});

// Configure winston logging
const logFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const logger = winston.createLogger({
  level: conf.logLevel,
  format: logFormat,
  transports: [new winston.transports.Console()],
});

clear();
logger.info(figlet.textSync("stampede", { horizontalLayout: "full" }));
logger.info(module.exports.version);
logger.info("Redis Host: " + conf.redisHost);
logger.info("Redis Port: " + conf.redisPort);
logger.info("Web Port: " + conf.webPort);
logger.info("SCM: " + conf.scm);
logger.info("GitHub APP ID: " + conf.githubAppID);
logger.info("GitHub PEM Path: " + conf.githubAppPEMPath);

if (conf.scm === "github") {
  // Load up our key for this GitHub app. You get this key from GitHub
  // when you create the app.
  if (conf.githubAppPEM == null) {
    if (conf.githubAppPEMPath != null) {
      const pem = fs.readFileSync(conf.githubAppPEMPath, "utf8");
      conf.githubAppPEM = pem;
    }
  } else {
    conf.githubAppPEM = conf.githubAppPEM.replace(/\\n/g, os.EOL);
  }

  // Do some validation of config since we can't operate without our required
  // config
  if (
    conf.githubAppID === 0 ||
    conf.githubAppPEM == null ||
    conf.githubHost == null
  ) {
    logger.error(
      "Stampede needs a GitHub APP ID, PEM certificate and host in order to operate. Not found in the config so unable to continue."
    );
    process.exit(1);
  }
}

// Initialize our cache
cache.startCache(conf);

// Setup a redis config for our Queue system
const redisConfig = {
  redis: {
    port: conf.redisPort,
    host: conf.redisHost,
    password: conf.redisPassword,
  },
};

// Start the webhook listener
taskQueue.setRedisConfig(redisConfig);

// Setup the notification queue(s)
notification.setRedisConfig(redisConfig);
if (conf.notificationQueues != null && conf.notificationQueues.length > 0) {
  notification.setNotificationQueues(conf.notificationQueues.split(","));
} else {
  notification.setNotificationQueues([]);
}

// Setup our scm based on what is configured
let scm = {};
if (conf.scm === "github") {
  scm = require("../scm/github");
} else if (conf.scm === "testMode") {
  scm = require("../scm/testMode");
} else {
  logger.error(
    "Invalid scm specified in the config: " + conf.scm + ", unable to continue"
  );
  process.exit(1);
}
scm.verifyCredentials(conf, logger);

// Start our own queue that listens for updates that need to get
// made back into GitHub
const responseQueue = taskQueue.createTaskQueue(
  "stampede-" + conf.responseQueue
);
responseQueue.on("error", function (error) {
  logger.error("Error from response queue: " + error);
});

responseQueue.process(function (job) {
  if (job.data.response === "taskUpdate") {
    return taskUpdate.handle(job.data.payload, conf, cache, scm, db, logger);
  } else if (job.data.response === "heartbeat") {
    cache.storeWorkerHeartbeat(job.data.payload);
    notification.workerHeartbeat(job.data.payload);
  }
});

/**
 * Handle shutdown gracefully
 */
process.on("SIGINT", function () {
  gracefulShutdown();
});

/**
 * gracefulShutdown
 */
async function gracefulShutdown() {
  logger.verbose("Closing queues");
  await responseQueue.close();
  await db.stop();
  await cache.stopCache();
  process.exit(0);
}

db.start(conf, logger);

setInterval(buildSchedule, fiveMinuteInterval);

async function buildSchedule() {
  const currentDate = new Date();
  logger.verbose(
    "Checking for any builds that need to be started at hour " +
      currentDate.getHours() +
      " minute " +
      currentDate.getMinutes()
  );
  // loop through any scheduled builds defined in the system
  // check the last run date and if a different date then check time
  // if we have passed the time to start the build, start it!
  const repositories = await db.fetchRepositories();
  for (let index = 0; index < repositories.rows.length; index++) {
    const repositoryBuilds = await cache.repositoryBuilds.fetchRepositoryBuilds(
      repositories.rows[index].owner,
      repositories.rows[index].repository
    );
    if (repositoryBuilds != null) {
      for (
        let buildIndex = 0;
        buildIndex < repositoryBuilds.length;
        buildIndex++
      ) {
        const buildInfo = await cache.repositoryBuilds.fetchRepositoryBuild(
          repositories.rows[index].owner,
          repositories.rows[index].repository,
          repositoryBuilds[buildIndex]
        );
        if (
          buildInfo.schedule != null &&
          (buildInfo.lastExecuteDate == null ||
            new Date(buildInfo.lastExecuteDate).getDate() !=
              currentDate.getDate() ||
            new Date(buildInfo.lastExecuteDate).getMonth() !=
              currentDate.getMonth() ||
            new Date(buildInfo.lastExecuteDate).getFullYear() !=
              currentDate.getFullYear())
        ) {
          if (
            currentDate.getHours() >= buildInfo.schedule.hour &&
            currentDate.getMinutes() >= buildInfo.schedule.minute
          ) {
            logger.verbose("Executing a repository build:");
            buildInfo.lastExecuteDate = currentDate;
            await cache.repositoryBuilds.updateRepositoryBuild(
              repositories.rows[index].owner,
              repositories.rows[index].repository,
              buildInfo
            );
            repositoryBuild.execute(
              repositories.rows[index].owner,
              repositories.rows[index].repository,
              repositoryBuilds[buildIndex],
              buildInfo,
              dependencies
            );
          }
        }
      }
    }
  }
}

const dependencies = {
  serverConfig: conf,
  cache: cache,
  scm: scm,
  db: db,
  redisConfig: redisConfig,
  viewsPath: viewsPath,
  logger: logger,
};

web.startRESTApi(dependencies);
