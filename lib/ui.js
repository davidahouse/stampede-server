let express = require('express')

const controllerIndex = require('../controller/index')
const controllerOrgs = require('../controller/orgs')
const controllerRepositories = require('../controller/repositories')
const controllerRepository = require('../controller/repository')
const controllerRepositoryUploadConfig = require('../controller/repositoryUploadConfig')
const controllerRepositoryUploadConfigFile = require('../controller/repositoryUploadConfigFile')

const controllerTasks = require('../controller/tasks')

function router(path, serverConf, redisClient) {
  let uiRouter = express.Router()
  
  uiRouter.get('/', function(req, res) {
    controllerIndex.handle(req, res, redisClient, path)
  })

  uiRouter.get('/orgs', function(req, res) {
    controllerOrgs.handle(req, res, serverConf, redisClient, path)
  })

  uiRouter.get('/repositories', function(req, res) {
    controllerRepositories.handle(req, res, serverConf, redisClient, path)
  })

  uiRouter.get('/repository', function(req, res) {
    controllerRepository.handle(req, res, redisClient, path)
  })

  uiRouter.get('/repositoryUploadConfig', function(req, res) {
    controllerRepositoryUploadConfig.handle(req, res, redisClient, path)
  })

  uiRouter.post('/repositoryUploadConfigFile', function(req, res) {
    controllerRepositoryUploadConfigFile.handle(req, res, redisClient, path)
  })

  uiRouter.get('/tasks', function(req, res) {
    controllerTasks.handle(req, res, redisClient, path)
  })
  return uiRouter
}

module.exports.router = router