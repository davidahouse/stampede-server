#!/usr/bin/env node
const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')
const fs = require('fs')

// Internal modules
const web = require('../lib/web')
const redis = require('../lib/redis')
const config = require('../lib/config')

const conf = require('rc')('stampede', {
  // defaults
  redisHost: 'cache',
  redisPort: 6379,
  redisPassword: null,
  webPort: 7766,
  githubAppID: 0,
  githubAppPEMPath: null,
  githubAppPEM: null,
  githubHost: null,
  stampedeConfigPath: null
})

clear()
console.log(chalk.red(figlet.textSync('stampede', {horizontalLayout: 'full'})))
console.log(chalk.red('Redis Host: ' + conf.redisHost))
console.log(chalk.red('Redis Port: ' + conf.redisPort))
console.log(chalk.red('Web Port: ' + conf.webPort))
console.log(chalk.red('GitHub APP ID: ' + conf.githubAppID))
console.log(chalk.red('GitHub PEM Path: ' + conf.githubAppPEMPath))

const pem = fs.readFileSync(conf.githubAppPEMPath, 'utf8')
conf.githubAppPEM = pem

redis.startRedis(conf)
web.startRESTApi(conf, redis)
config.initialize(conf, redis)