"use strict";
let express = require("express");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");

// Routers
const api = require("./api");
const ui = require("./ui");
const incoming = require("./incoming");

let app = express();
let server = null;
const morgan = require("morgan");

let bodyParser = require("body-parser");

function start(dependencies) {
  // If we don't have any web enabled, we can just exit
  console.dir(dependencies.serverConfig);
  if (
    dependencies.serverConfig.handlePortal != "enabled" &&
    dependencies.serverConfig.handleIncoming != "enabled"
  ) {
    dependencies.logger.info(
      "Neither portal or incoming enabled so now web port is started"
    );
    return;
  }

  if (
    dependencies.serverConfig.logLevel === "http" ||
    dependencies.serverConfig.logLevel === "verbose"
  ) {
    app.use(morgan("dev"));
  }
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(express.static(__dirname + "/../public"));
  app.set("view engine", "pug");
  app.use(fileUpload());

  let port = process.env.PORT || dependencies.serverConfig.webPort;
  if (dependencies.serverConfig.handlePortal === "enabled") {
    const apiRouter = api.router(dependencies);
    app.use(apiRouter);
    const uiRouter = ui.router(dependencies);
    app.use(uiRouter);
  }
  if (dependencies.serverConfig.handleIncoming === "enabled") {
    const incomingRouter = incoming.router(dependencies);
    app.use(incomingRouter);
  }
  app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.render(dependencies.viewsPath + "error", {
      owners: [],
      isAdmin: false,
    });
  });
  app.use(function (req, res, next) {
    res.render(dependencies.viewsPath + "error", {
      owners: [],
      isAdmin: false,
    });
  });
  server = app.listen(port, function () {
    dependencies.logger.info(
      "Listening on port: " + dependencies.serverConfig.webPort
    );
  });
}

async function stop() {
  if (server != null) {
    server.close();
  }
}

module.exports.start = start;
module.exports.stop = stop;
