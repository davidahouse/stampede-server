"use strict";

const chalk = require("chalk");
const notification = require("../lib/notification");
const task = require("./task");

/**
 * handle task update
 * @param {*} job
 * @param {*} conf
 * @param {*} cache
 * @param {*} scm
 */
async function handle(job, serverConf, cache, scm) {
  try {
    console.log(chalk.green("--- taskUpdate: " + job.taskID));
    const event = job;
    console.dir(event);

    const taskID = event.taskID;

    // Update task in the cache and send out notifications
    if (event.status === "completed") {
      event.stats.completedAt = new Date();
      // Remove this task from the active list
      await cache.removeTaskFromActiveList(event.buildID, taskID);
      await notification.taskCompleted(taskID, event);

      console.log(chalk.green("--- Task status is: " + event.status));
      console.log(
        chalk.green("--- Checking number of active tasks for: " + event.buildID)
      );
      const remainingTasks = await cache.fetchActiveTasks(event.buildID);
      console.log(
        chalk.green(
          "--- Build has " +
            remainingTasks.length.toString() +
            " remaining task(s)"
        )
      );
      if (remainingTasks == null || remainingTasks.length === 0) {
        await cache.removeBuildFromActiveList(event.buildID);
        await notification.buildCompleted(event.buildID, {
          owner: event.owner,
          repo: event.repository,
          buildKey: event.buildKey,
          buildNumber: event.buildNumber
        });
      }
    } else {
      await notification.taskUpdated(taskID, event);
    }

    // If this update isn't for a PR check, then the rest of the flow is meaningless
    if (event.scm.checkRunID == null) {
      console.log("--- skipping since it is not a check update");
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
    console.dir(update);
    console.log("--- updating check");
    scm.updateCheck(event.owner, event.repository, serverConf, update);
  } catch (e) {
    console.log(chalk.red(e));
  }
}

module.exports.handle = handle;
