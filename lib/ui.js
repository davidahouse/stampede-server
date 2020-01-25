"use strict";
const express = require("express");

// Controllers
const index = require("../controllers/index");

// Repositories
const repositories = require("../controllers/repositories/repositories");
const repositoryDetails = require("../controllers/repositories/repositoryDetails");
const repositoryBuildDetails = require("../controllers/repositories/buildDetails");
const repositoryTaskDetails = require("../controllers/repositories/taskDetails");
const repositoryRequeueTask = require("../controllers/repositories/requeueTask");
const repositoryExecuteTaskSelection = require("../controllers/repositories/executeTaskSelection");
const repositoryExecuteTaskConfig = require("../controllers/repositories/executeTaskConfig");
const repositoryExecuteTask = require("../controllers/repositories/executeTask");
const repositoryToggleConfigSource = require("../controllers/repositories/toggleConfigSource");
const repositoryUploadRepositoryConfig = require("../controllers/repositories/uploadRepositoryConfig");
const repositoryViewCachedConfig = require("../controllers/repositories/viewCachedConfig");

const repositoryViewOrgConfigDefaults = require("../controllers/repositories/viewOrgConfigDefaults");
const repositoryUploadOrgConfigDefaults = require("../controllers/repositories/uploadOrgConfigDefaults");
const repositoryRemoveOrgConfigDefaults = require("../controllers/repositories/removeOrgConfigDefaults");

const repositoryViewOrgConfigOverrides = require("../controllers/repositories/viewOrgConfigOverrides");
const repositoryUploadOrgConfigOverrides = require("../controllers/repositories/uploadOrgConfigOverrides");
const repositoryRemoveOrgConfigOverrides = require("../controllers/repositories/removeOrgConfigOverrides");

const repositoryViewRepoConfigDefaults = require("../controllers/repositories/viewRepoConfigDefaults");
const repositoryUploadRepoConfigDefaults = require("../controllers/repositories/uploadRepoConfigDefaults");
const repositoryRemoveRepoConfigDefaults = require("../controllers/repositories/removeRepoConfigDefaults");

const repositoryViewRepoConfigOverrides = require("../controllers/repositories/viewRepoConfigOverrides");
const repositoryUploadRepoConfigOverrides = require("../controllers/repositories/uploadRepoConfigOverrides");
const repositoryRemoveRepoConfigOverrides = require("../controllers/repositories/removeRepoConfigOverrides");

// Monitor
const monitorActiveBuilds = require("../controllers/monitor/activeBuilds");
const monitorActiveTasks = require("../controllers/monitor/activeTasks");
const monitorWorkers = require("../controllers/monitor/workers");
const monitorWorkerDetails = require("../controllers/monitor/workerDetails");
const monitorBuildDetails = require("../controllers/monitor/buildDetails");
const monitorBuildTaskDetails = require("../controllers/monitor/buildTaskDetails");
const monitorQueues = require("../controllers/monitor/queues");
const monitorRequeueTask = require("../controllers/monitor/requeueTask");
const monitorCancelTask = require("../controllers/monitor/cancelTask");

// History
const historyBuilds = require("../controllers/history/builds");
const historyTasks = require("../controllers/history/tasks");
const historyBuildDetails = require("../controllers/history/buildDetails");
const historyBuildTaskDetails = require("../controllers/history/buildTaskDetails");
const historyTaskDetails = require("../controllers/history/taskDetails");
const historyRequeueTask = require("../controllers/history/requeueTask");
const historyBuildSummary = require("../controllers/history/buildSummary");
const historyTaskSummary = require("../controllers/history/taskSummary");
const historyDailySummary = require("../controllers/history/dailySummary");

// Admin
const adminTasks = require("../controllers/admin/tasks");
const adminTaskConfig = require("../controllers/admin/taskConfig");
const adminDefaults = require("../controllers/admin/defaults");
const adminOverrides = require("../controllers/admin/overrides");
const adminQueues = require("../controllers/admin/queues");
const adminInfo = require("../controllers/admin/info");
const adminUploadDefaults = require("../controllers/admin/uploadDefaults");
const adminUploadOverrides = require("../controllers/admin/uploadOverrides");
const adminUploadQueues = require("../controllers/admin/uploadQueues");
const adminUploadTask = require("../controllers/admin/uploadTask");
const adminRemoveTask = require("../controllers/admin/removeTask");

// Misc top level controllers

/**
 * router
 * @param {*} cache
 * @param {*} db
 * @param {*} path
 * @param {*} conf
 * @return {*} the router for UI controllers
 */
function router(cache, db, path, conf) {
  const basicRouter = express.Router();

  const redisConfig = {
    redis: {
      port: conf.redisPort,
      host: conf.redisHost,
      password: conf.redisPassword
    }
  };

  basicRouter.get("/", function(req, res) {
    index.handle(req, res, cache, db, path);
  });

  // Repositories

  basicRouter.get("/repositories", function(req, res) {
    repositories.handle(req, res, cache, db, path);
  });

  basicRouter.get("/repositories/repositoryDetails", function(req, res) {
    repositoryDetails.handle(req, res, cache, db, path);
  });

  basicRouter.get("/repositories/buildDetails", function(req, res) {
    repositoryBuildDetails.handle(req, res, cache, db, path);
  });

  basicRouter.get("/repositories/taskDetails", function(req, res) {
    repositoryTaskDetails.handle(req, res, cache, db, path);
  });

  basicRouter.get("/repositories/requeueTask", function(req, res) {
    repositoryRequeueTask.handle(req, res, cache, db, path, redisConfig);
  });

  basicRouter.get("/repositories/executeTaskSelection", function(req, res) {
    repositoryExecuteTaskSelection.handle(
      req,
      res,
      cache,
      db,
      path,
      redisConfig
    );
  });

  basicRouter.post("/repositories/executeTaskConfig", function(req, res) {
    repositoryExecuteTaskConfig.handle(req, res, cache, db, path, redisConfig);
  });

  basicRouter.post("/repositories/executeTask", function(req, res) {
    repositoryExecuteTask.handle(req, res, cache, db, path, redisConfig, conf);
  });

  basicRouter.get("/repositories/toggleConfigSource", function(req, res) {
    repositoryToggleConfigSource.handle(req, res, cache, db, path);
  });

  basicRouter.post("/repositories/uploadRepositoryConfig", function(req, res) {
    repositoryUploadRepositoryConfig.handle(req, res, cache, db, path);
  });

  basicRouter.get("/repositories/viewCachedConfig", function(req, res) {
    repositoryViewCachedConfig.handle(req, res, cache, db, path, redisConfig);
  });

  basicRouter.get("/repositories/viewOrgConfigDefaults", function(req, res) {
    repositoryViewOrgConfigDefaults.handle(req, res, cache, db, path);
  });

  basicRouter.post("/repositories/uploadOrgConfigDefaults", function(req, res) {
    repositoryUploadOrgConfigDefaults.handle(req, res, cache, db, path);
  });

  basicRouter.post("/repositories/removeOrgConfigDefaults", function(req, res) {
    repositoryRemoveOrgConfigDefaults.handle(req, res, cache, db, path);
  });

  basicRouter.get("/repositories/viewOrgConfigOverrides", function(req, res) {
    repositoryViewOrgConfigOverrides.handle(req, res, cache, db, path);
  });

  basicRouter.post("/repositories/uploadOrgConfigOverrides", function(
    req,
    res
  ) {
    repositoryUploadOrgConfigOverrides.handle(req, res, cache, db, path);
  });

  basicRouter.post("/repositories/removeOrgConfigOverrides", function(
    req,
    res
  ) {
    repositoryRemoveOrgConfigOverrides.handle(req, res, cache, db, path);
  });

  basicRouter.get("/repositories/viewRepoConfigDefaults", function(req, res) {
    repositoryViewRepoConfigDefaults.handle(req, res, cache, db, path);
  });

  basicRouter.post("/repositories/uploadRepoConfigDefaults", function(
    req,
    res
  ) {
    repositoryUploadRepoConfigDefaults.handle(req, res, cache, db, path);
  });

  basicRouter.post("/repositories/removeRepoConfigDefaults", function(
    req,
    res
  ) {
    repositoryRemoveRepoConfigDefaults.handle(req, res, cache, db, path);
  });

  basicRouter.get("/repositories/viewRepoConfigOverrides", function(req, res) {
    repositoryViewRepoConfigOverrides.handle(req, res, cache, db, path);
  });

  basicRouter.post("/repositories/uploadRepoConfigOverrides", function(
    req,
    res
  ) {
    repositoryUploadRepoConfigOverrides.handle(req, res, cache, db, path);
  });

  basicRouter.post("/repositories/removeRepoConfigOverrides", function(
    req,
    res
  ) {
    repositoryRemoveRepoConfigOverrides.handle(req, res, cache, db, path);
  });

  // Monitor

  basicRouter.get("/monitor/activeBuilds", function(req, res) {
    monitorActiveBuilds.handle(req, res, cache, db, path);
  });

  basicRouter.get("/monitor/activeTasks", function(req, res) {
    monitorActiveTasks.handle(req, res, cache, db, path);
  });

  basicRouter.get("/monitor/workers", function(req, res) {
    monitorWorkers.handle(req, res, cache, db, path);
  });

  basicRouter.get("/monitor/workerDetails", function(req, res) {
    monitorWorkerDetails.handle(req, res, cache, db, path);
  });

  basicRouter.get("/monitor/buildDetails", function(req, res) {
    monitorBuildDetails.handle(req, res, cache, db, path);
  });

  basicRouter.get("/monitor/buildTaskDetails", function(req, res) {
    monitorBuildTaskDetails.handle(req, res, cache, db, path);
  });

  basicRouter.get("/monitor/queues", function(req, res) {
    monitorQueues.handle(req, res, cache, db, path, conf);
  });

  basicRouter.get("/monitor/requeueTask", function(req, res) {
    monitorRequeueTask.handle(req, res, cache, db, path, redisConfig);
  });

  basicRouter.get("/monitor/cancelTask", function(req, res) {
    monitorCancelTask.handle(req, res, cache, db, path, redisConfig);
  });

  // History

  basicRouter.get("/history/builds", function(req, res) {
    historyBuilds.handle(req, res, cache, db, path);
  });

  basicRouter.get("/history/buildDetails", function(req, res) {
    historyBuildDetails.handle(req, res, cache, db, path);
  });

  basicRouter.get("/history/tasks", function(req, res) {
    historyTasks.handle(req, res, cache, db, path);
  });

  basicRouter.get("/history/buildTaskDetails", function(req, res) {
    historyBuildTaskDetails.handle(req, res, cache, db, path);
  });

  basicRouter.get("/history/taskDetails", function(req, res) {
    historyTaskDetails.handle(req, res, cache, db, path);
  });

  basicRouter.get("/history/requeueTask", function(req, res) {
    historyRequeueTask.handle(req, res, cache, db, path, redisConfig);
  });

  basicRouter.get("/history/buildSummary", function(req, res) {
    historyBuildSummary.handle(req, res, cache, db, path);
  });

  basicRouter.get("/history/taskSummary", function(req, res) {
    historyTaskSummary.handle(req, res, cache, db, path);
  });

  basicRouter.get("/history/dailySummary", function(req, res) {
    historyDailySummary.handle(req, res, cache, db, path);
  });

  // Admin

  basicRouter.get("/admin/tasks", function(req, res) {
    adminTasks.handle(req, res, cache, db, path);
  });

  basicRouter.get("/admin/taskConfig", function(req, res) {
    adminTaskConfig.handle(req, res, cache, db, path);
  });

  basicRouter.get("/admin/defaults", function(req, res) {
    adminDefaults.handle(req, res, cache, db, path);
  });

  basicRouter.get("/admin/overrides", function(req, res) {
    adminOverrides.handle(req, res, cache, db, path);
  });

  basicRouter.get("/admin/queues", function(req, res) {
    adminQueues.handle(req, res, cache, db, path);
  });

  basicRouter.get("/admin/info", function(req, res) {
    adminInfo.handle(req, res, cache, db, path);
  });

  basicRouter.post("/admin/uploadDefaults", function(req, res) {
    adminUploadDefaults.handle(req, res, cache, db, path);
  });

  basicRouter.post("/admin/uploadOverrides", function(req, res) {
    adminUploadOverrides.handle(req, res, cache, db, path);
  });

  basicRouter.post("/admin/uploadQueues", function(req, res) {
    adminUploadQueues.handle(req, res, cache, db, path);
  });

  basicRouter.post("/admin/uploadTask", function(req, res) {
    adminUploadTask.handle(req, res, cache, db, path);
  });

  basicRouter.post("/admin/removeTask", function(req, res) {
    adminRemoveTask.handle(req, res, cache, db, path);
  });

  return basicRouter;
}

module.exports.router = router;
