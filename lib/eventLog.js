'use strict'
const fs = require('fs')

let eventCount = 0

/**
 * save
 * @param {*} event
 * @param {*} path
 */
async function save(event, path) {
  eventCount = eventCount + 1
  const fileName = path + '/' + eventCount.toString() + '-event.log'
  fs.writeFileSync(fileName, JSON.stringify(event, null, 2))
}

module.exports.save = save
