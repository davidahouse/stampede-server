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

function startRESTApi(conf, cache, scm) {
  let port = process.env.PORT || conf.webPort
  let apiRouter = api.router(conf, cache, scm)
  app.use(apiRouter)
  app.listen(port, function() {
    console.log(chalk.yellow('Listening on port: ' + conf.webPort))
  })
}

module.exports.startRESTApi = startRESTApi
