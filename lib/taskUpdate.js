"use strict";

const notification = require("../services/notification");
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
    let artifactList = "";

    logger.verbose(JSON.stringify(event, null, 2));

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

        // Strip out the artifacts returned and store them in their own table
        // instead of leaving them in the task details JSON. This ensures backward
        // compatibility with existing workers. Note that workers can also send
        // separate events to store task artifact details.
        if (event.result.artifacts) {
          for (
            let aindex = 0;
            aindex < event.result.artifacts.length;
            aindex++
          ) {
            await db.storeTaskArtifact(
              event.taskID,
              event.result.artifacts[aindex].title,
              event.result.artifacts[aindex].type,
              event.result.artifacts[aindex].url,
              event.result.artifacts[aindex].contents,
              event.result.artifacts[aindex].metadata
            );

            if (
              event.result.artifacts[aindex].type == "download" ||
              event.result.artifacts[aindex].type == "link"
            ) {
              artifactList +=
                "- [" +
                event.result.artifacts[aindex].title +
                "](" +
                event.result.artifacts[aindex].url +
                ")\n";
            } else if (event.result.artifacts[aindex].type == "installplist") {
              artifactList +=
                "- [" +
                event.result.artifacts[aindex].title +
                "](" +
                "itms-services://?action=download-manifest&url=" +
                encodeURIComponent(event.result.artifacts[aindex].url) +
                ")\n";
            }
          }
          event.result.artifacts = [];
        }

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
        const buildConfig = await cache.fetchBuildConfig(event.buildID);
        await cache.removeBuildConfig(event.buildID);
        await notification.buildCompleted(
          event.buildID,
          {
            owner: event.owner,
            repo: event.repository,
            buildKey: event.buildKey,
            buildNumber: event.buildNumber,
            buildConfig: buildConfig,
          },
          cache
        );
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
      check_run_id: event.scm.checkRunID,
    };

    if (event.result != null) {
      if (event.result.conclusion != null) {
        update.conclusion = event.result.conclusion;
        update.completed_at = new Date().toISOString();
      }

      if (event.result.title != null) {
        update.output = {
          title: event.result.title,
          summary: summaryWithArtifactList(
            event.result.summary,
            event.result.summaryTable,
            artifactList,
            serverConf
          ),
          text: event.result.text != null ? event.result.text : "",
        };
      }
    }
    logger.verbose("updating check");
    scm.updateCheck(event.owner, event.repository, serverConf, update);
  } catch (e) {
    logger.error(e);
  }
}

function summaryWithArtifactList(
  summary,
  summaryTable,
  artifactList,
  serverConf
) {
  let result = "";
  if (summary != null) {
    result += summary;
  }

  if (summaryTable != null && summaryTable.length > 0) {
    result += "\n\n";
    result += "| | |\n";
    result += "| --- | --- |\n";
    summaryTable.forEach((summary) => {
      result += "| ";
      if (summary.link != null) {
        result += '<a href="' + summary.link + '">';
        result += summary.title;
        result += "</a>";
      } else {
        result += summary.title;
      }
      result += " | ";
      if (summary.valueString != null) {
        result += summary.valueString;
        result += " ";
      }
      if (summary.valueBadges != null) {
        summary.valueBadges.forEach((badge) => {
          if (summary.link != null) {
            result += '<a href="' + summary.link + '">';
          }
          if (badge.logo != null && badge.style != null) {
            result +=
              '<img src="https://img.shields.io/badge/' +
              badge.shield +
              "?logo=" +
              badge.logo +
              "&style=" +
              badge.style +
              '" alt="' +
              badge.alt +
              '"/>';
          } else if (badge.logo != null) {
            result +=
              '<img src="https://img.shields.io/badge/' +
              badge.shield +
              "?logo=" +
              badge.logo +
              '" alt="' +
              badge.alt +
              '"/>';
          } else if (badge.style != null) {
            result +=
              '<img src="https://img.shields.io/badge/' +
              badge.shield +
              "?style=" +
              badge.style +
              '" alt="' +
              badge.alt +
              '"/>';
          } else {
            result +=
              '<img src="https://img.shields.io/badge/' +
              badge.shield +
              '" alt="' +
              badge.alt +
              '"/>';
          }
          if (summary.link != null) {
            result += "</a>";
          }
          result += " ";
        });
      }
      result += " | \n";
    });
  }

  if (
    artifactList != null &&
    serverConf.autoRenderArtifactListComment === "enabled"
  ) {
    result += "\n\n";
    result += artifactList;
  }
  return result;
}

module.exports.handle = handle;
