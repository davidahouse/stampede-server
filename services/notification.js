"use strict";

const Queue = require("bull");

let redisConfig = {};
let notificationQueues = [];

// Public methods

/**
 * start
 * @param {*} dependencies
 */
function start(dependencies) {
  redisConfig = dependencies.redisConfig;
  if (
    dependencies.serverConfig.notificationQueues != null &&
    dependencies.serverConfig.notificationQueues.length > 0
  ) {
    notificationQueues = dependencies.serverConfig.notificationQueues.split(
      ","
    );
  }
}

/**
 * repositoryEventReceived
 * @param {*} event
 * @param {*} payload
 */
async function repositoryEventReceived(event, payload) {
  const notification = {
    notification: "repositoryEventReceived",
    id: event,
    payload: payload,
  };
  await sendNotification(notification);
}

/**
 * buildStarted
 * @param {*} build
 * @param {*} payload
 */
async function buildStarted(build, payload, cache) {
  const notification = {
    notification: "buildStarted",
    id: build,
    payload: payload,
  };
  await sendNotification(notification);

  // If build has any notifications configured, send them
  if (
    payload.buildConfig != null &&
    payload.buildConfig.notifications != null
  ) {
    const notifications = payload.buildConfig.notifications;
    if (notifications.all != null) {
      await sendToNotificationChannels(
        build,
        "buildStarted",
        "all",
        payload,
        notifications.all,
        cache
      );
    }
    if (notifications.start != null) {
      await sendToNotificationChannels(
        build,
        "buildStarted",
        "all",
        payload,
        notifications.start,
        cache
      );
    }
  }
}

/**
 * buildCompleted
 * @param {*} build
 * @param {*} payload
 */
async function buildCompleted(build, payload, cache) {
  const notification = {
    notification: "buildCompleted",
    id: build,
    payload: payload,
  };
  await sendNotification(notification);

  // If build has any notifications configured, send them
  if (
    payload.buildConfig != null &&
    payload.buildConfig.notifications != null
  ) {
    const notifications = payload.buildConfig.notifications;
    if (notifications.all != null) {
      await sendToNotificationChannels(
        build,
        "buildCompleted",
        "all",
        payload,
        notifications.all,
        cache
      );
    }
    if (notifications.completed != null) {
      await sendToNotificationChannels(
        build,
        "buildCompleted",
        "all",
        payload,
        notifications.completed,
        cache
      );
    }
    if (notifications.completedSuccess != null) {
      await sendToNotificationChannels(
        build,
        "buildCompleted",
        "success",
        payload,
        notifications.completedSuccess,
        cache
      );
    }
    if (notifications.completedFailure != null) {
      await sendToNotificationChannels(
        build,
        "buildCompleted",
        "failure",
        payload,
        notifications.completedFailure,
        cache
      );
    }
  }
}

/**
 * taskStarted
 * @param {*} task
 * @param {*} payload
 */
async function taskStarted(task, payload) {
  const notification = {
    notification: "taskStarted",
    id: task,
    payload: payload,
  };
  await sendNotification(notification);
}

/**
 * taskCompleted
 * @param {*} task
 * @param {*} payload
 */
async function taskCompleted(task, payload) {
  const notification = {
    notification: "taskCompleted",
    id: task,
    payload: payload,
  };
  await sendNotification(notification);
}

/**
 * taskUpdated
 * @param {*} task
 * @param {*} payload
 */
async function taskUpdated(task, payload) {
  const notification = {
    notification: "taskUpdated",
    id: task,
    payload: payload,
  };
  await sendNotification(notification);
}

/**
 * workerHeartbeat
 * @param {*} heartbeat
 */
async function workerHeartbeat(heartbeat) {
  const notification = {
    notification: "workerHeartbeat",
    id: heartbeat.workerID,
    payload: heartbeat,
  };
  await sendNotification(notification);
}

// Private Methods

/**
 * send notifications
 * @param {*} notification
 */
async function sendNotification(notification) {
  for (let index = 0; index < notificationQueues.length; index++) {
    const q = new Queue("stampede-" + notificationQueues[index], redisConfig);
    await q.add(notification, { removeOnComplete: true, removeOnFail: true });
    await q.close();
  }
}

async function sendToNotificationChannels(
  build,
  notification,
  filter,
  payload,
  channels,
  cache
) {
  for (let index = 0; index < channels.length; index++) {
    const config = await cache.notifications.fetchNotificationChannelConfig(
      channels[index].id
    );
    if (config != null && config.providerID != null) {
      const q = new Queue("stampede-" + config.providerID, redisConfig);
      await q.add(
        {
          build: build,
          notification: notification,
          filter: filter,
          payload: payload,
          channelConfig: config,
        },
        { removeOnComplete: true, removeOnFail: true }
      );
      await q.close();
    }
  }
}

module.exports.start = start;
module.exports.repositoryEventReceived = repositoryEventReceived;
module.exports.buildStarted = buildStarted;
module.exports.buildCompleted = buildCompleted;
module.exports.taskStarted = taskStarted;
module.exports.taskCompleted = taskCompleted;
module.exports.taskUpdated = taskUpdated;
module.exports.workerHeartbeat = workerHeartbeat;
