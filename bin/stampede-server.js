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
const incomingHandler = require("../lib/incomingHandler");
const retentionHandler = require("../lib/retentionHandler");
const buildScheduleHandler = require("../lib/buildScheduleHandler");

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
  dbLogSQL: false,
  // Misc
  responseQueue: "response",
  incomingQueue: "incoming",
  notificationQueues: "",
  stampedeFileName: ".stampede.yaml",
  scm: "github",
  // Control if the server enables the portal functions of the UI & API
  handlePortal: "enabled",
  // Control if the server enables the incoming endpoints for webhooks
  handleIncoming: "enabled",
  // Control if the server will handle anything in the incoming queue
  handleIncomingQueue: "enabled",
  // Control if the server will handle anything in the response queue
  handleResponseQueue: "enabled",
  // Control if the server looks for builds that need to be auto-started
  handleBuildScheduler: "enabled",
  // Control if the server executes the retention policy handler
  handleRetentionScheduler: "enabled",
  // Debug assist properties
  logEventPath: null,
  testModeRepoConfigPath: null,
  // Admin mode
  adminPassword: "stampede",
  // Logging
  logLevel: "info",
  // Retention
  defaultBuildRetentionDays: 30,
  defaultReleaseBuildRetentionDays: 3000,
  cleanupArtifactTask: null,
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

let responseQueue = null;
if (conf.handleResponseQueue === "enabled") {
  // Start our own queue that listens for updates that need to get
  // made back into GitHub
  responseQueue = taskQueue.createTaskQueue("stampede-" + conf.responseQueue);
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
}

let incomingQueue = null;
if (conf.handleIncomingQueue === "enabled") {
  incomingQueue = taskQueue.createTaskQueue("stampede-" + conf.incomingQueue);
  incomingQueue.on("error", function (error) {
    logger.error("Error from incoming queue: " + error);
  });

  incomingQueue.process(function (job) {
    return incomingHandler.handle(job.data, dependencies);
  });
}

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
  if (responseQueue != null) {
    await responseQueue.close();
  }
  await db.stop();
  await cache.stopCache();
  process.exit(0);
}

db.start(conf, logger);

if (
  conf.handleBuildScheduler === "enabled" ||
  conf.handleRetentionScheduler === "enabled"
) {
  setInterval(buildSchedule, fiveMinuteInterval);
}

async function buildSchedule() {
  if (conf.handleBuildScheduler === "enabled") {
    await buildScheduleHandler.handle(dependencies);
  }

  if (conf.handleRetentionScheduler === "enabled") {
    await retentionHandler.handle(dependencies);
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
  incomingQueue: incomingQueue,
};

web.startRESTApi(dependencies);
