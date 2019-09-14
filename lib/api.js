'use strict'
let express = require('express')

// API Controllers
const apiGithub = require('../api/github')

function router(serverConf, redisClient) {
  let basicRouter = express.Router()

  basicRouter.post('/github', function(req, res) {
    apiGithub.handle(req, res, serverConf, redisClient)
  })

  return basicRouter
}

module.exports.router = router
