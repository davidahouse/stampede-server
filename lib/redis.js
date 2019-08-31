const asyncRedis = require("async-redis")

let client

function createRedisClient(conf) {
  if (conf.redisPassword != null) {
    return asyncRedis.createClient({host: conf.redisHost, 
                               port: conf.redisPort, 
                               password: conf.redisPassword})
  } else {
    return asyncRedis.createClient({host: conf.redisHost, 
                               port: conf.redisPort})
  }
}

function startRedis(conf) {
  client = createRedisClient(conf)
  client.on('error', function(err) {
    console.log('redis connect error: ' + err)
  })
}

async function store(key, value) {
  try {
    await client.set(key, JSON.stringify(value))
  } catch (e) {
    console.log('Error setting key ' + key + ': ' + e)
  }
}

async function storeExpiring(key, seconds, value) {
  try {
    await client.setex(key, seconds, JSON.stringify(value))
  } catch (e) {
    console.log('Error setting key ' + key + ': ' + e)
  }
}

async function fetch(key, defaultValue) {
  console.log('-- Fetching: ' + key)
  try {
    const value = await client.get(key)
    if (value != null) {
      return JSON.parse(value)
    } else {
      return defaultValue
    }
  } catch (e) {
    console.log('Error fetching key: ' + key + ' ' + e)
    return defaultValue
  }
}

async function fetchKeys(pattern) {
  console.log('-- Fetching Keys: ' + pattern)
  try {
    const keys = await client.keys(pattern)
    if (keys != null) {
      return keys
    } else {
      return []
    }
  } catch (e) {
    console.log('Error fetching keys: ' + pattern + ' ' + e)
    return []
  }
}

async function fetchMembers(key, defaultValue) {
  console.log('-- Fetching: ' + key)
  try {
    const value = await client.smembers(key)
    if (value != null) {
      return value
    } else {
      return defaultValue
    }
  } catch (e) {
    console.log('Error fetching key: ' + key + ' ' + e)
    return defaultValue
  }
}

async function increment(key) {
  console.log('-- Incrementing: ' + key)
  try {
    const value = await client.incr(key)
    return value
  } catch (e) {
    console.log('Error incrementing key: ' + key + ' ' + e)
    return null
  }
}

async function rpush(key, value) {
  try {
    await client.rpush(key, value)
  } catch (e) {
    console.log('Error pushing ' + key + ': ' + e)
  }
}

module.exports.startRedis = startRedis
module.exports.fetch = fetch
module.exports.store = store
module.exports.storeExpiring = storeExpiring
module.exports.fetchMembers = fetchMembers
module.exports.increment = increment
module.exports.rpush = rpush
