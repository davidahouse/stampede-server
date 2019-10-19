'use strict';

const Queue = require('bull');

let redisConfig = {};

function setRedisConfig(config) {
  redisConfig = config;
}

function createTaskQueue(name) {
  return new Queue(name, redisConfig);
}

module.exports.setRedisConfig = setRedisConfig;
module.exports.createTaskQueue = createTaskQueue;
