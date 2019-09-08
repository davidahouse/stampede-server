let express = require('express')
const chalk = require('chalk')
let path = __dirname + '/../views/'

// Web Controllers
const controllerIndex = require('../controller/index')

// API Controllers
const apiGithub = require('../api/github')
const apiTaskUpdate = require('../api/taskUpdate')

let app = express()
const expressWs = require('express-ws')(app)
const morgan = require('morgan')
const morganBody = require('morgan-body')
const cookieParser = require('cookie-parser')

let router = express.Router() // eslint-disable-line new-cap
let bodyParser = require('body-parser')
app.use(morgan('dev'))
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static('public'))
app.set('view engine', 'pug')

let redisClient
let elasticSearchClient
let serverConf

function requireHTTPS(req, res, next) {
  if (req.headers && req.headers.$wssp === "80" && serverConf.requireHttps) {
    return res.redirect('https://' + req.get('host') + req.url)
  }
  next()
}

app.use(requireHTTPS)

// Web interface

let basicRouter = express.Router()

basicRouter.post('/github', function(req, res) {
  apiGithub.handle(req, res, serverConf, redisClient)
})

basicRouter.post('/task', function(req, res) {
  apiTaskUpdate.handle(req, res, serverConf, redisClient)
})

app.use(basicRouter)

let uiRouter = express.Router()

uiRouter.get('/', function(req, res) {
  controllerIndex.handle(req, res, redisClient, path)
})

app.use(uiRouter)

function startRESTApi(conf, redis, elasticSearch) {
  serverConf = conf
  redisClient = redis
  elasticSearchClient = elasticSearch
  let port = process.env.PORT || conf.webPort

  app.listen(port, function() {
    console.log(chalk.yellow('Listening on port: ' + conf.webPort))
  })
}

module.exports.startRESTApi = startRESTApi