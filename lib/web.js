"use strict";
let express = require("express");
const chalk = require("chalk");
const path = __dirname + "/../views/";
const fileUpload = require("express-fileupload");

// Routers
const api = require("./api");
const ui = require("./ui");

let app = express();
const morgan = require("morgan");

let bodyParser = require("body-parser");
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/../public"));
app.set("view engine", "pug");
app.use(fileUpload());

function startRESTApi(conf, cache, scm, db) {
  let port = process.env.PORT || conf.webPort;
  let apiRouter = api.router(conf, cache, scm, db);
  app.use(apiRouter);
  const uiRouter = ui.router(cache, db, path, conf);
  app.use(uiRouter);
  app.listen(port, function() {
    console.log(chalk.yellow("Listening on port: " + conf.webPort));
  });
}

module.exports.startRESTApi = startRESTApi;
