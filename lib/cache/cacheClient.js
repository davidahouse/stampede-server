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
  client.on("error", function (err) {});
  client.on("ready", function () {
    clientReady = true;
  });
  client.on("connect", function () {});
  client.on("reconnecting", function () {});
  client.on("end", function () {
    clientReady = false;
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
 * pushItem
 * Push an item on a list, but limit the total number of items in the list
 * @param {*} key
 * @param {*} value
 * @param {*} limit
 */
async function pushItem(key, value, limit) {
  try {
    const count = await client.lpush(key, JSON.stringify(value));
    if (count > limit) {
      const result = await client.ltrim(key, 0, limit - 1);
    }
  } catch (e) {
    console.error("Error pushing item to list: " + key + " " + e);
  }
}

/**
 * fetchItems
 * Fetch all the items from a list, returning an array
 * @param {*} key
 */
async function fetchItems(key) {
  const found = [];
  try {
    const count = await client.llen(key);
    for (let index = 0; index < count; index++) {
      const item = await client.lindex(key, index);
      found.push(JSON.parse(item));
    }
  } catch (e) {
    console.error("Error pushing item to list: " + key + " " + e);
  }
  return found;
}

/**
 * expireItem
 * Set the expiration on a single item
 * @param {*} key
 * @param {*} expire
 */
async function expireItem(key, expire) {
  try {
    await client.expire(key, expire);
  } catch (e) {
    console.error("Error trying to expire item: " + key + " " + e);
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
module.exports.pushItem = pushItem;
module.exports.fetchItems = fetchItems;
module.exports.expireItem = expireItem;
