'use strict'

const Queue = require('bull')

let redisConfig = {}
let notificationQueues = []

// Public methods

/**
 * setRedisConfig
 * @param {*} config
 */
function setRedisConfig(config) {
  redisConfig = config
}

/**
 * setNotificationQueues
 * @param {*} queues
 */
function setNotificationQueues(queues) {
  notificationQueues = queues
}

/**
 * repositoryEventReceived
 * @param {*} event
 * @param {*} payload
 */
async function repositoryEventReceived(event, payload) {
  const notification = {
    notification: 'repositoryEventReceived',
    id: event,
    payload: payload,
  }
  sendNotification(notification)
}

/**
 * buildStarted
 * @param {*} build
 * @param {*} payload
 */
async function buildStarted(build, payload) {
  const notification = {
    notification: 'buildStarted',
    id: build,
    payload: payload,
  }
  sendNotification(notification)
}

/**
 * buildCompleted
 * @param {*} build
 * @param {*} payload
 */
async function buildCompleted(build, payload) {
  const notification = {
    notification: 'buildCompleted',
    id: build,
    payload: payload,
  }
  sendNotification(notification)
}

/**
 * taskStarted
 * @param {*} task
 * @param {*} payload
 */
async function taskStarted(task, payload) {
  const notification = {
    notification: 'taskStarted',
    id: task,
    payload: payload,
  }
  sendNotification(notification)
}

/**
 * taskCompleted
 * @param {*} task
 * @param {*} payload
 */
async function taskCompleted(task, payload) {
  const notification = {
    notification: 'taskCompleted',
    id: task,
    payload: payload,
  }
  sendNotification(notification)
}

/**
 * taskUpdated
 * @param {*} task
 * @param {*} payload
 */
async function taskUpdated(task, payload) {
  const notification = {
    notification: 'taskUpdated',
    id: task,
    payload: payload,
  }
  sendNotification(notification)
}

// Private Methods

/**
 * send notifications
 * @param {*} notification
 */
async function sendNotification(notification) {
  for (let index = 0; index < notificationQueues.length; index++) {
    const q = new Queue(notificationQueues[index], redisConfig)
    await q.add(notification)
    await q.close()
  }
}

module.exports.setRedisConfig = setRedisConfig
module.exports.setNotificationQueues = setNotificationQueues
module.exports.repositoryEventReceived = repositoryEventReceived
module.exports.buildStarted = buildStarted
module.exports.buildCompleted = buildCompleted
module.exports.taskStarted = taskStarted
module.exports.taskCompleted = taskCompleted
module.exports.taskUpdated = taskUpdated
