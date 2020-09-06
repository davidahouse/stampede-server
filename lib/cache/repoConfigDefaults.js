"use strict";

let client;

function setClient(redisClient) {
  client = redisClient;
}

async function storeDefaults(org, repo, defaults) {
  await client.store("stampede-config-defaults-" + org + "-" + repo, defaults);
}

async function setDefault(org, repo, name, value) {
  const defaults = await fetchDefaults(org, repo);
  defaults.defaults[name] = value;
  await storeDefaults(org, repo, defaults);
}

async function fetchDefaults(org, repo) {
  const defaults = await client.fetch(
    "stampede-config-defaults-" + org + "-" + repo,
    {
      defaults: {}
    }
  );
  return defaults;
}

async function removeDefaults(org, repo) {
  await client.remove("stampede-config-defaults-" + org + "-" + repo);
}

async function removeDefault(org, repo, name) {
  const defaults = await fetchDefaults(org, repo);
  delete defaults.defaults[name];
  await storeDefaults(org, repo, defaults);
}

module.exports.setClient = setClient;
module.exports.storeDefaults = storeDefaults;
module.exports.setDefault = setDefault;
module.exports.fetchDefaults = fetchDefaults;
module.exports.removeDefaults = removeDefaults;
module.exports.removeDefault = removeDefault;
