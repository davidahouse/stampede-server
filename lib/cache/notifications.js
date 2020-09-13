"use strict";

let client;

function setClient(redisClient) {
  client = redisClient;
}

/**
 * fetchNotificationChannels
 */
async function fetchNotificationChannels() {
  const channels = await client.fetchMembers("stampede-notification-channels");
  return channels;
}

/**
 * fetchChannelConfig
 * @param {*} id
 * @return {Object} channel config
 */
async function fetchNotificationChannelConfig(id) {
  const config = await client.fetch("stampede-notification-channel-" + id);
  return config;
}

/**
 * removeNotificationChannelConfig
 * @param {*} id
 */
async function removeNotificationChannelConfig(id) {
  await client.remove("stampede-notification-channel-" + id);
  await client.removeMember("stampede-notification-channels", id);
}

/**
 * storeNotificationChannel
 * @param {*} id
 */
async function storeNotificationChannel(id) {
  await client.add("stampede-notification-channels", id);
}

/**
 * storeNotificationChannelConfig
 * @param {*} id
 * @param {*} config
 */
async function storeNotificationChannelConfig(id, config) {
  await client.store("stampede-notification-channel-" + id, config);
}

module.exports.setClient = setClient;
module.exports.fetchNotificationChannels = fetchNotificationChannels;
module.exports.fetchNotificationChannelConfig = fetchNotificationChannelConfig;
module.exports.removeNotificationChannelConfig = removeNotificationChannelConfig;
module.exports.storeNotificationChannel = storeNotificationChannel;
module.exports.storeNotificationChannelConfig = storeNotificationChannelConfig;
