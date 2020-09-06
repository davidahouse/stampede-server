"use strict";

let client;

function setClient(redisClient) {
  client = redisClient;
}

async function storeOverrides(org, repo, overrides) {
  await client.store(
    "stampede-config-overrides-" + org + "-" + repo,
    overrides
  );
}

async function setOverride(org, repo, name, value) {
  const overrides = await fetchOverrides(org, repo);
  overrides.overrides[name] = value;
  await storeOverrides(org, repo, overrides);
}

async function fetchOverrides(org, repo) {
  const overrides = await client.fetch(
    "stampede-config-overrides-" + org + "-" + repo,
    {
      overrides: {}
    }
  );
  return overrides;
}

async function removeOverrides(org, repo) {
  await client.remove("stampede-config-overrides-" + org + "-" + repo);
}

async function removeOverride(org, repo, name) {
  const overrides = await fetchOverrides(org, repo);
  delete overrides.overrides[name];
  await storeOverrides(org, repo, overrides);
}

module.exports.setClient = setClient;
module.exports.storeOverrides = storeOverrides;
module.exports.setOverride = setOverride;
module.exports.fetchOverrides = fetchOverrides;
module.exports.removeOverrides = removeOverrides;
module.exports.removeOverride = removeOverride;
