"use strict";
let express = require("express");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");

// Routers
const api = require("./api");
const ui = require("./ui");

let app = express();
const morgan = require("morgan");

let bodyParser = require("body-parser");
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname + "/../public"));
app.set("view engine", "pug");
app.use(fileUpload());

function startRESTApi(dependencies) {
  let port = process.env.PORT || dependencies.serverConfig.webPort;
  let apiRouter = api.router(dependencies);
  app.use(apiRouter);
  const uiRouter = ui.router(dependencies);
  app.use(uiRouter);
  app.listen(port, function() {
    dependencies.logger.verbose(
      "Listening on port: " + dependencies.serverConfig.webPort
    );
  });
}

module.exports.startRESTApi = startRESTApi;
