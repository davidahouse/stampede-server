"use strict";

let client;

function setClient(redisClient) {
  client = redisClient;
}

async function storeOverrides(org, overrides) {
  await client.store("stampede-config-overrides-" + org, overrides);
}

async function setOverride(org, name, value) {
  const overrides = await fetchOverrides(org);
  overrides.overrides[name] = value;
  await storeOverrides(org, overrides);
}

async function fetchOverrides(org) {
  const overrides = await client.fetch("stampede-config-overrides-" + org, {
    overrides: {}
  });
  return overrides;
}

async function removeOverrides(org) {
  await client.remove("stampede-config-overrides-" + org);
}

async function removeOverride(org, name) {
  const overrides = await fetchOverrides(org);
  delete overrides.overrides[name];
  await storeOverrides(org, overrides);
}

module.exports.setClient = setClient;
module.exports.storeOverrides = storeOverrides;
module.exports.setOverride = setOverride;
module.exports.fetchOverrides = fetchOverrides;
module.exports.removeOverrides = removeOverrides;
module.exports.removeOverride = removeOverride;
