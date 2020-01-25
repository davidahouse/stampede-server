#!/usr/bin/env node
"use strict";
const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const fs = require("fs");
const cache = require("stampede-cache");
const os = require("os");
require("pkginfo")(module);
const viewsPath = __dirname + "/../views/";

// Internal modules
const web = require("../lib/web");
const taskQueue = require("../lib/taskQueue");
const taskUpdate = require("../lib/taskUpdate");
const taskExecute = require("../lib/taskExecute");
const notification = require("../lib/notification");
const db = require("../lib/db");

const conf = require("rc")("stampede", {
  // redis
  redisHost: "localhost",
  redisPort: 6379,
  redisPassword: null,
  // web
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
  // Misc
  responseQueue: "response",
  notificationQueues: "",
  stampedeFileName: ".stampede.yaml",
  scm: "github",
  // Debug assist properties
  logEventPath: null,
  testModeRepoConfigPath: null
});

clear();
console.log(
  chalk.red(figlet.textSync("stampede", { horizontalLayout: "full" }))
);
console.log(chalk.yellow(module.exports.version));
console.log(chalk.red("Redis Host: " + conf.redisHost));
console.log(chalk.red("Redis Port: " + conf.redisPort));
console.log(chalk.red("Web Port: " + conf.webPort));
console.log(chalk.red("SCM: " + conf.scm));
console.log(chalk.red("GitHub APP ID: " + conf.githubAppID));
console.log(chalk.red("GitHub PEM Path: " + conf.githubAppPEMPath));

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
  console.log(
    chalk.red(
      "Stampede needs a GitHub APP ID, PEM certificate and host in order to operate. Not found in the config so unable to continue."
    )
  );
  process.exit(1);
}

// Initialize our cache
cache.startCache(conf);

// Setup a redis config for our Queue system
const redisConfig = {
  redis: {
    port: conf.redisPort,
    host: conf.redisHost,
    password: conf.redisPassword
  }
};

// Start the webhook listener
taskQueue.setRedisConfig(redisConfig);

// Setup the notification queue(s)
notification.setRedisConfig(redisConfig);
notification.setNotificationQueues(conf.notificationQueues.split(","));

// Setup our scm based on what is configured
let scm = {};
if (conf.scm === "github") {
  scm = require("../scm/github");
} else if (conf.scm === "testMode") {
  scm = require("../scm/testMode");
} else {
  console.error(
    "Invalid scm specified in the config: " + conf.scm + ", unable to continue"
  );
  process.exit(1);
}

// Start our own queue that listens for updates that need to get
// made back into GitHub
const responseQueue = taskQueue.createTaskQueue(
  "stampede-" + conf.responseQueue
);
responseQueue.on("error", function(error) {
  console.log(chalk.red("Error from response queue: " + error));
});

responseQueue.process(function(job) {
  console.log("--- response: " + job.data.response);
  if (job.data.response === "taskUpdate") {
    return taskUpdate.handle(job.data.payload, conf, cache, scm, db);
  } else if (job.data.response === "heartbeat") {
    cache.storeWorkerHeartbeat(job.data.payload);
    notification.workerHeartbeat(job.data.payload);
  } else if (job.data.response === "executeTask") {
    // REFACTOR:
    // This can be removed since we will handle this directly
    return taskExecute.handle(job.data.payload, conf, cache, scm);
  }
});

/**
 * Handle shutdown gracefully
 */
process.on("SIGINT", function() {
  gracefulShutdown();
});

/**
 * gracefulShutdown
 */
async function gracefulShutdown() {
  console.log("Closing queues");
  await responseQueue.close();
  await db.stop();
  await cache.stopCache();
  process.exit(0);
}

db.start(conf);

const dependencies = {
  serverConfig: conf,
  cache: cache,
  scm: scm,
  db: db,
  redisConfig: redisConfig,
  viewsPath: viewsPath
};

web.startRESTApi(dependencies);
