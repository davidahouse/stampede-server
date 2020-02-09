"use strict";
let express = require("express");
require("pkginfo")(module);

// API Controllers
const apiGithub = require("../api/github");
const activeBuilds = require("../api/activeBuilds");
const activeTasks = require("../api/activeTasks");
const repositories = require("../api/repositories");
const buildDetails = require("../api/buildDetails");
const workerStatus = require("../api/workerStatus");
const recentBuilds = require("../api/recentBuilds");
const queueSummary = require("../api/queueSummary");
const executeTask = require("../api/executeTask");

// Admin
const adminTasks = require("../api/admin/tasks");
const adminConfigDefaults = require("../api/admin/configDefaults");
const adminConfigOverrides = require("../api/admin/configOverrides");
const adminQueues = require("../api/admin/queues");

function router(dependencies) {
  let basicRouter = express.Router();

  const serverConf = dependencies.serverConfig;
  const cache = dependencies.cache;
  const db = dependencies.db;
  const scm = dependencies.scm;

  basicRouter.post("/github", function(req, res) {
    apiGithub.handle(req, res, serverConf, cache, scm, db);
  });

  basicRouter.get("/api/activeBuilds", function(req, res) {
    activeBuilds.handle(req, res, serverConf, cache, db);
  });

  basicRouter.get("/api/activeTasks", function(req, res) {
    activeTasks.handle(req, res, serverConf, cache, db);
  });

  basicRouter.get("/api/repositories", function(req, res) {
    repositories.handle(req, res, serverConf, cache, db);
  });

  basicRouter.get("/api/buildDetails", function(req, res) {
    buildDetails.handle(req, res, serverConf, cache, db);
  });

  basicRouter.get("/api/workerStatus", function(req, res) {
    workerStatus.handle(req, res, serverConf, cache, db);
  });

  basicRouter.get("/api/recentBuilds", function(req, res) {
    recentBuilds.handle(req, res, serverConf, cache, db);
  });

  basicRouter.get("/api/queueSummary", function(req, res) {
    queueSummary.handle(req, res, serverConf, cache, db);
  });

  basicRouter.post("/api/executeTask", function(req, res) {
    executeTask.handle(req, res, serverConf, cache, scm, db);
  });

  // Admin

  basicRouter.get("/api/admin/tasks", function(req, res) {
    adminTasks.handle(req, res, serverConf, cache, db);
  });

  basicRouter.get("/api/admin/configDefaults", function(req, res) {
    adminConfigDefaults.handle(req, res, serverConf, cache, db);
  });

  basicRouter.get("/api/admin/configOverrides", function(req, res) {
    adminConfigOverrides.handle(req, res, serverConf, cache, db);
  });

  basicRouter.get("/api/admin/queues", function(req, res) {
    adminQueues.handle(req, res, serverConf, cache, db);
  });

  return basicRouter;
}

module.exports.router = router;
