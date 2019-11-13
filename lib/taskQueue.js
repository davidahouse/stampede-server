"use strict";

const Queue = require("bull");
var Redis = require("ioredis");

let redisConfig = {};
let redisClient = null;
let redisSubscriber = null;

function setRedisConfig(config) {
  redisConfig = config;
  redisClient = new Redis(config.redis);
  redisSubscriber = new Redis(config.redis);
}

function createTaskQueue(name) {
  const opts = {
    createClient: function(type) {
      switch (type) {
        case "client":
          return redisClient;
        case "subscriber":
          return redisSubscriber;
        default:
          return new Redis(redisConfig.redis);
      }
    }
  };
  return new Queue(name, opts);
}

module.exports.setRedisConfig = setRedisConfig;
module.exports.createTaskQueue = createTaskQueue;
