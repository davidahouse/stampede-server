"use strict";

let client;

function setClient(redisClient) {
  client = redisClient;
}

/**
 * storeSystemQueues
 * @param {*} queues
 */
async function storeSystemQueues(queues) {
  await client.store("stampede-config-queues", queues);
}

/**
 * fetchSystemQueues
 * @return {*} queues
 */
async function fetchSystemQueues() {
  const queues = await client.fetch("stampede-config-queues");
  return queues;
}

/**
 * addSystemQueue
 * @param {*} queue
 */
async function addSystemQueue(queue) {
  const queues = await fetchSystemQueues();
  queues.push(queue);
  await storeSystemQueues(queues);
}

/**
 * removeSystemQueue
 * @param {*} queue
 */
async function removeSystemQueue(queue) {
  const queues = await fetchSystemQueues();
  queues.splice(queues.indexOf(queue), 1);
  await storeSystemQueues(queues);
}

module.exports.setClient = setClient;
module.exports.storeSystemQueues = storeSystemQueues;
module.exports.fetchSystemQueues = fetchSystemQueues;
module.exports.addSystemQueue = addSystemQueue;
module.exports.removeSystemQueue = removeSystemQueue;
