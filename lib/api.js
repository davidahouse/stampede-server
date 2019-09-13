'use strict'
let express = require('express')

// API Controllers
const apiGithub = require('../api/github')
const apiTaskUpdate = require('../api/taskUpdate')

function router(serverConf, redisClient) {
  let basicRouter = express.Router()

  basicRouter.post('/github', function(req, res) {
    apiGithub.handle(req, res, serverConf, redisClient)
  })
  
  basicRouter.post('/task', function(req, res) {
    apiTaskUpdate.handle(req, res, serverConf, redisClient)
  })
  return basicRouter
}

module.exports.router = router