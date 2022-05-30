#!/usr/bin/env node
"use strict";
const clear = require("clear");
const figlet = require("figlet");
const fs = require("fs");
const os = require("os");
require("pkginfo")(module);
const viewsPath = __dirname + "/../views/";
const winston = require("winston");

// Dependencies
const db = require("../lib/db");
const cache = require("../lib/cache/cache");

// Services
const web = require("../services/web");
const notification = require("../services/notification");
const incomingQueue = require("../services/incomingQueue");
const responseQueue = require("../services/responseQueue");
const notificationChannelQueue = require("../services/notificationChannelQueue");

// Other libs
const taskQueue = require("../lib/taskQueue");
const retentionHandler = require("../lib/retentionHandler");
const buildScheduleHandler = require("../lib/buildScheduleHandler");
const queueHeartbeatHandler = require("../lib/queueHeartbeatHandler");

const thirtySeconds = 1000 * 30;
const fiveMinuteInterval = 1000 * 60 * 5;
const conf = require("rc-house")("stampede", {
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
  handleQueueHeartbeatNotification: "enabled",
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
  // Control if the server will handle notification channel queue
  handleNotificationChannelQueue: "enabled",
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
  // API Docs
  enableApiDocs: false,
  // Notification channels
  slackNotificationMoreInfoURL: null,
  prCommentNotificationMoreInfoURL: null,
  // HTTP Notification feed
  queueSummaryNotificationURL: null,
  // Worker notes
  workerHeartbeatTimeout: 3600,
  // Repository event cache limit
  repoEventLimit: 10,
  // Repository parse error limit and timeout
  repoParseErrorLimit: 10,
  repoParseErrorTimeout: 14400,
  // Render artifact list automatically in PR comment, slack notification and GitHub check summary
  autoRenderArtifactListComment: "enabled",
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

// Initialize all our dependencies

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
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
};

taskQueue.setRedisConfig(redisConfig);

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
  await responseQueue.shutdown();
  await notificationChannelQueue.shutdown();
  await incomingQueue.shutdown();
  await db.stop();
  await cache.stopCache();
  await web.stop();
  process.exit(0);
}

db.start(conf, logger);

if (
  conf.handleBuildScheduler === "enabled" ||
  conf.handleRetentionScheduler === "enabled" ||
  conf.handleQueueHeartbeatNotification === "enabled"
) {
  setInterval(schedule, thirtySeconds);
}

let scheduleDuration = 0;

async function schedule() {
  if (conf.handleQueueHeartbeatNotification === "enabled") {
    await queueHeartbeatHandler.handle(dependencies);
  }

  scheduleDuration += thirtySeconds;
  if (scheduleDuration > fiveMinuteInterval) {
    if (conf.handleBuildScheduler === "enabled") {
      await buildScheduleHandler.handle(dependencies);
    }

    if (conf.handleRetentionScheduler === "enabled") {
      await retentionHandler.handle(dependencies);
    }
    scheduleDuration = 0;
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

// Start all our services
let incomingEventQueue = incomingQueue.start(dependencies);
dependencies.incomingQueue = incomingEventQueue;
notification.start(dependencies);
responseQueue.start(dependencies);
notificationChannelQueue.start(dependencies);
web.start(dependencies);
