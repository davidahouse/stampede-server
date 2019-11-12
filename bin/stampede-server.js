#!/usr/bin/env node
"use strict";
const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const fs = require("fs");
const cache = require("stampede-cache");
const os = require("os");
require("pkginfo")(module);

// Internal modules
const web = require("../lib/web");
const config = require("../lib/config");
const taskQueue = require("../lib/taskQueue");
const taskUpdate = require("../lib/taskUpdate");
const notification = require("../lib/notification");

const conf = require("rc")("stampede", {
  // defaults
  redisHost: "localhost",
  redisPort: 6379,
  redisPassword: null,
  webPort: 7766,
  githubAppID: 0,
  githubAppPEMPath: null,
  githubAppPEM: null,
  githubHost: null,
  stampedeConfigPath: null,
  responseQueue: "response",
  notificationQueues: "",
  stampedeFileName: ".stampede.yaml",
  scm: "github",
  taskQueueDefault: "tasks",
  // Debug assist properties
  logEventPath: null,
  testModeRepoConfigPath: null,
  // Heartbeat
  heartbeatQueue: "heartbeat"
});

clear();
console.log(
  chalk.red(figlet.textSync("stampede", { horizontalLayout: "full" }))
);
console.log(chalk.yellow(module.exports.version));
console.log(chalk.red("Redis Host: " + conf.redisHost));
console.log(chalk.red("Redis Port: " + conf.redisPort));
console.log(chalk.red("Web Port: " + conf.webPort));
console.log(chalk.red("Config Path: " + conf.stampedeConfigPath));
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

// Start the webhook listener
taskQueue.setRedisConfig({
  redis: {
    port: conf.redisPort,
    host: conf.redisHost,
    password: conf.redisPassword
  }
});

// Setup the notification queue
notification.setRedisConfig({
  redis: {
    port: conf.redisPort,
    host: conf.redisHost,
    password: conf.redisPassword
  }
});
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
  return taskUpdate.handle(job, conf, cache, scm);
});

// Handle any heartbeat messages
const heartbeatQueue = taskQueue.createTaskQueue(
  "stampede-" + conf.heartbeatQueue
);
heartbeatQueue.on("error", function(error) {
  console.log(chalk.red("Error from heartbeat queue: " + error));
});

heartbeatQueue.process(function(heartbeat) {
  cache.storeWorkerHeartbeat(heartbeat.data);
  notification.workerHeartbeat(heartbeat.data);
});

web.startRESTApi(conf, cache, scm);
config.initialize(conf, cache);
