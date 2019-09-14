'use strict'
let express = require('express')
const chalk = require('chalk')

// Routers
const api = require('./api')

let app = express()
const morgan = require('morgan')

let bodyParser = require('body-parser')
app.use(morgan('dev'))
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({ extended: true }))

let redisClient
let serverConf

function requireHTTPS(req, res, next) {
  if (req.headers && req.headers.$wssp === '80' && serverConf.requireHttps) {
    return res.redirect('https://' + req.get('host') + req.url)
  }
  next()
}
app.use(requireHTTPS)

function startRESTApi(conf, redis) {
  serverConf = conf
  redisClient = redis
  let port = process.env.PORT || conf.webPort

  let apiRouter = api.router(serverConf, redisClient)
  app.use(apiRouter)
  app.listen(port, function() {
    console.log(chalk.yellow('Listening on port: ' + conf.webPort))
  })
}

module.exports.startRESTApi = startRESTApi
