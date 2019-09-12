let express = require('express')
const chalk = require('chalk')
let path = __dirname + '/../views/'

// Routers
const api = require('./api')
const ui = require('./ui')

let app = express()
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')

let bodyParser = require('body-parser')
app.use(morgan('dev'))
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static('public'))
app.set('view engine', 'pug')
app.use(fileUpload())

let redisClient
let serverConf

function requireHTTPS(req, res, next) {
  if (req.headers && req.headers.$wssp === "80" && serverConf.requireHttps) {
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

  let uiRouter = ui.router(path, serverConf, redisClient)
  app.use(uiRouter)

  app.listen(port, function() {
    console.log(chalk.yellow('Listening on port: ' + conf.webPort))
  })
}

module.exports.startRESTApi = startRESTApi