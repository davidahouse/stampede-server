"use strict";
const asyncRedis = require("async-redis");

let client;
let clientReady = false;

/**
 * createRedisClient
 * @param {*} conf
 * @return {object} redis client
 */
function createRedisClient(conf) {
  if (conf.redisPassword != null) {
    client = asyncRedis.createClient({
      host: conf.redisHost,
      port: conf.redisPort,
      password: conf.redisPassword,
    });
  } else {
    client = asyncRedis.createClient({
      host: conf.redisHost,
      port: conf.redisPort,
    });
  }
  client.on("error", function (err) {
    console.error("redis connect error: " + err);
  });
  client.on("ready", function () {
    clientReady = true;
    console.info("REDIS CLIENT READY");
  });
  client.on("connect", function () {
    console.info("REDIS CLIENT CONNECT");
  });
  client.on("reconnecting", function () {
    console.info("REDIS CLIENT RECONNECTING");
  });
  client.on("end", function () {
    clientReady = false;
    console.info("REDIS CLIENT END");
  });
}

/**
 * add
 * @param {*} key
 * @param {*} value
 */
async function add(key, value) {
  try {
    if (clientReady == false) {
      return;
    }
    await client.sadd(key, value);
  } catch (e) {
    console.error("Error adding key " + key + ": " + e);
  }
}

/**
 * store
 * @param {*} key
 * @param {*} value
 * @param {int} expiring
 */
async function store(key, value, expiring) {
  try {
    if (clientReady == false) {
      return;
    }
    if (expiring != null) {
      await client.set(key, JSON.stringify(value), "EX", expiring);
    } else {
      await client.set(key, JSON.stringify(value));
    }
  } catch (e) {
    console.error("Error setting key " + key + ": " + e);
  }
}

/**
 * increment
 * @param {*} key
 */
async function increment(key) {
  try {
    if (clientReady == false) {
      return;
    }
    const value = await client.incr(key);
    return value;
  } catch (e) {
    console.error("Error incrementing key: " + key + " " + e);
    return null;
  }
}

/**
 * remove
 * @param {*} key
 */
async function remove(key) {
  try {
    if (clientReady == false) {
      return;
    }
    await client.del(key);
  } catch (e) {
    console.error("Error removing " + key + ": " + e);
  }
}

/**
 * removeMember
 * @param {*} key
 * @param {*} value
 */
async function removeMember(key, value) {
  try {
    if (clientReady == false) {
      return;
    }
    await client.srem(key, value);
  } catch (e) {
    console.error("Error removing " + key + ": " + value + ": " + e);
  }
}

/**
 * fetch
 * @param {*} key
 * @param {*} defaultValue
 */
async function fetch(key, defaultValue) {
  try {
    if (clientReady == false) {
      return defaultValue;
    }
    const value = await client.get(key);
    if (value != null) {
      return JSON.parse(value);
    } else {
      return defaultValue;
    }
  } catch (e) {
    console.error("Error fetching key: " + key + " " + e);
    return defaultValue;
  }
}

/**
 * fetchMembers
 * @param {*} key
 * @param {*} defaultValue
 */
async function fetchMembers(key, defaultValue) {
  try {
    if (clientReady == false) {
      return defaultValue;
    }
    const value = await client.smembers(key);
    if (value != null) {
      return value;
    } else {
      return defaultValue;
    }
  } catch (e) {
    console.error("Error fetching key: " + key + " " + e);
    return defaultValue;
  }
}

/**
 * quit
 */
async function quit() {
  await client.quit();
}

module.exports.createRedisClient = createRedisClient;
module.exports.add = add;
module.exports.store = store;
module.exports.increment = increment;
module.exports.remove = remove;
module.exports.removeMember = removeMember;
module.exports.fetch = fetch;
module.exports.fetchMembers = fetchMembers;
module.exports.quit = quit;
