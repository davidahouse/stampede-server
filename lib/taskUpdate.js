"use strict";

const notification = require("../lib/notification");
const task = require("./task");

/**
 * handle task update
 * @param {*} job
 * @param {*} conf
 * @param {*} cache
 * @param {*} scm
 * @param {*} db
 */
async function handle(job, serverConf, cache, scm, db, logger) {
  try {
    logger.verbose("taskUpdate: " + job.taskID);
    const event = job;

    const taskID = event.taskID;

    // Update task in the cache and send out notifications
    if (event.status === "completed") {
      event.stats.completedAt = new Date();
      // Remove this task from the active list
      await cache.removeTaskFromActiveList(event.buildID, taskID);
      try {
        await db.storeTaskCompleted(
          event.taskID,
          event.status,
          event.stats.finishedAt,
          event.stats.completedAt,
          event.result.conclusion
        );
        await db.storeTaskDetailsUpdate(event.taskID, event);
      } catch (e) {
        logger.error("Error storing task completed details: " + e);
      }
      await notification.taskCompleted(taskID, event);

      logger.verbose("Task status is: " + event.status);
      logger.verbose("Checking number of active tasks for: " + event.buildID);
      const remainingTasks = await cache.fetchActiveTasks(event.buildID);
      logger.verbose(
        "Build has " + remainingTasks.length.toString() + " remaining task(s)"
      );
      if (remainingTasks == null || remainingTasks.length === 0) {
        await cache.removeBuildFromActiveList(event.buildID);
        try {
          await db.storeBuildComplete(event.buildID);
        } catch (e) {
          logger.error("Error storing build completed details: " + e);
        }
        await notification.buildCompleted(event.buildID, {
          owner: event.owner,
          repo: event.repository,
          buildKey: event.buildKey,
          buildNumber: event.buildNumber
        });
      }
    } else {
      try {
        await db.storeTaskUpdate(
          event.taskID,
          event.status,
          event.stats.startedAt,
          event.worker.node
        );
        await db.storeTaskDetailsUpdate(event.taskID, event);
      } catch (e) {
        logger.error("Error storing task updated details: " + e);
      }
      await notification.taskUpdated(taskID, event);
    }

    // If this update isn't for a PR check, then the rest of the flow is meaningless
    if (event.scm.checkRunID == null) {
      logger.verbose("skipping since it is not a check update");
      return;
    }

    const update = {
      owner: event.owner,
      repo: event.repository,
      status: event.status,
      check_run_id: event.scm.checkRunID
    };

    if (event.result != null) {
      if (event.result.conclusion != null) {
        update.conclusion = event.result.conclusion;
        update.completed_at = new Date().toISOString();
      }

      if (event.result.title != null) {
        update.output = {
          title: event.result.title,
          summary: event.result.summary != null ? event.result.summary : "",
          text: event.result.text != null ? event.result.text : ""
        };
      }
    }
    logger.verbose("updating check");
    scm.updateCheck(event.owner, event.repository, serverConf, update);
  } catch (e) {
    logger.error(e);
  }
}

module.exports.handle = handle;
