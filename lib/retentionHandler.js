const taskDetail = require("./taskDetail");
const taskQueue = require("./taskQueue");

let cleanupBuild = 1;

async function handle(dependencies) {
  try {
    const pullRequestBuilds = await dependencies.db.buildsForRetention(
      "pull-request",
      dependencies.serverConfig.defaultBuildRetentionDays
    );
    await deleteBuilds(pullRequestBuilds, dependencies);

    const branchBuilds = await dependencies.db.buildsForRetention(
      "branch-push",
      dependencies.serverConfig.defaultBuildRetentionDays
    );
    await deleteBuilds(branchBuilds, dependencies);

    const repositoryBuilds = await dependencies.db.buildsForRetention(
      "repository-build",
      dependencies.serverConfig.defaultBuildRetentionDays
    );
    await deleteBuilds(repositoryBuilds, dependencies);

    const releaseBuilds = await dependencies.db.buildsForRetention(
      "release",
      dependencies.serverConfig.defaultReleaseBuildRetentionDays
    );
    await deleteBuilds(releaseBuilds, dependencies);
  } catch (e) {
    dependencies.logger.error("Error in retentionHandler: " + e);
  }
}

async function deleteBuilds(builds, dependencies) {
  for (let index = 0; index < builds.rows.length; index++) {
    await deleteBuild(builds.rows[index], dependencies);
  }
}

async function deleteBuild(build, dependencies) {
  const artifacts = await fetchBuildArtifacts(build, dependencies);
  console.log("DELETING ARTIFACTS:");
  console.dir(artifacts);
  await queueArtifactCleanupTasks(artifacts, dependencies);

  dependencies.logger.info("DELETING BUILD: " + build.build_id);
  await dependencies.db.removeBuild(build.build_id);
}

async function fetchBuildArtifacts(build, dependencies) {
  const tasks = await dependencies.db.fetchBuildTasks(build.build_id);
  const artifacts = [];
  for (let index = 0; index < tasks.rows.length; index++) {
    const taskDetails = await dependencies.db.fetchTaskDetails(
      tasks.rows[index].task_id
    );
    if (
      taskDetails.rows.length > 0 &&
      taskDetails.rows[0].details != null &&
      taskDetails.rows[0].details.result != null &&
      taskDetails.rows[0].details.result.artifacts != null
    ) {
      for (
        let aindex = 0;
        aindex < taskDetails.rows[0].details.result.artifacts.length;
        aindex++
      ) {
        artifacts.push(taskDetails.rows[0].details.result.artifacts[aindex]);
      }
    }
  }
  return artifacts;
}

async function queueArtifactCleanupTasks(artifacts, dependencies) {
  if (dependencies.serverConfig.cleanupArtifactTask == null) {
    return;
  }

  const workerConfig = await taskDetail.taskWorkerConfig(
    dependencies.serverConfig.cleanupArtifactTask,
    dependencies.cache
  );

  for (let index = 0; index < artifacts.length; index++) {
    if (artifacts[index].type === "download") {
      const taskConfig = {
        url: {
          value: artifacts[index].url,
          source: "repoConfig",
        },
      };

      const taskDetails = {
        owner: "system",
        repository: "system",
        buildKey: "cleanup",
        buildNumber: cleanupBuild.toString(),
        buildID: "cleanup-" + cleanupBuild.toString(),
        taskID: dependencies.serverConfig.cleanupArtifactTask,
        status: "queued",
        task: {
          id: dependencies.serverConfig.cleanupArtifactTask,
          number: "1",
        },
        config: taskConfig,
        workerConfig: workerConfig,
        scm: {},
        stats: {
          queuedAt: Date(),
        },
      };
      cleanupBuild += 1;

      let queueName = await taskDetail.taskQueue(
        dependencies.serverConfig.cleanupArtifactTask,
        dependencies.cache
      );
      if (queueName != null) {
        taskDetails.taskQueue = queueName;
        dependencies.logger.verbose("Adding task to queue: " + queueName);
        const queue = taskQueue.createTaskQueue("stampede-" + queueName);
        await queue.add(taskDetails, {
          removeOnComplete: true,
          removeOnFail: true,
        });
        await queue.close();
      }
    }
  }
}

module.exports.handle = handle;
