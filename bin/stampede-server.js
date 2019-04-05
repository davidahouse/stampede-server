#!/usr/bin/env node
const chalk = require('chalk')
const clear = require('clear')
const figlet = require('figlet')
const redis = require('redis')
let express = require('express')
const fs = require('fs')
let app = express()
const expressWs = require('express-ws')(app)
let router = express.Router() // eslint-disable-line new-cap
let bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use('/', router)

const conf = require('rc')('stampede', {
  // defaults
  redisHost: 'localhost',
  redisPort: 6379,
  redisPassword: null,
  webPort: 7766,
  jobFolder: '.'
})

let client = createRedisClient()

client.on('error', function(err) {
  console.log('redis connect error: ' + err)
})

// TODO: Setup REST API routes

clear()
console.log(chalk.red(figlet.textSync('stampede server', {horizontalLayout: 'full'})))
console.log(chalk.red('Redis Host: ' + conf.redisHost))
console.log(chalk.red('Redis Port: ' + conf.redisPort))
console.log(chalk.red('Web Port: ' + conf.webPort))

app.ws('/socket', function(ws, req) {
  ws.on('message', function(msg) {
    logger.info('message from socket: msg')
  })
})

app.listen(conf.webPort, function() {
  console.log(chalk.yellow('Listening on port: ' + conf.webPort))
})

const jobFiles = fs.readdirSync(conf.jobFolder).filter(function(file) {
  const jobFile = fs.readFileSync(conf.jobFolder + '/' + file)
  const job = JSON.parse(jobFile)
  client.set('job_' + job.title, JSON.stringify(job))
})

function createRedisClient() {
  if (conf.redisPassword != null) {
    return redis.createClient({host: conf.redisHost, 
                               port: conf.redisPort, 
                               password: conf.redisPassword})
  } else {
    return redis.createClient({host: conf.redisHost, 
                               port: conf.redisPort})
  }
}