"use strict";

/**
 * handle task artifact
 * @param {*} event
 * @param {*} dependencies
 */
async function handle(event, dependencies) {
  try {
    const taskID = event.taskID;
    dependencies.logger.verbose("taskArtifact: " + taskID);

    await dependencies.db.storeTaskArtifact(
      taskID,
      event.title,
      event.type,
      event.url,
      event.contents,
      event.metadata
    );
  } catch (e) {
    dependencies.logger.error(e);
  }
}

module.exports.handle = handle;
