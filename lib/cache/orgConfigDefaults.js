"use strict";

let client;

function setClient(redisClient) {
  client = redisClient;
}

async function storeDefaults(org, defaults) {
  await client.store("stampede-config-defaults-" + org, defaults);
}

async function setDefault(org, name, value) {
  const defaults = await fetchDefaults(org);
  defaults.defaults[name] = value;
  await storeDefaults(org, defaults);
}

async function fetchDefaults(org) {
  const defaults = await client.fetch("stampede-config-defaults-" + org, {
    defaults: {}
  });
  return defaults;
}

async function removeDefaults(org) {
  await client.remove("stampede-config-defaults-" + org);
}

async function removeDefault(org, name) {
  const defaults = await fetchDefaults(org);
  delete defaults.defaults[name];
  await storeDefaults(org, defaults);
}

module.exports.setClient = setClient;
module.exports.storeDefaults = storeDefaults;
module.exports.setDefault = setDefault;
module.exports.fetchDefaults = fetchDefaults;
module.exports.removeDefaults = removeDefaults;
module.exports.removeDefault = removeDefault;
