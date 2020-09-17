"use strict";
let express = require("express");
const glob = require("glob");
const swaggerUi = require("swagger-ui-express");

/**
 * The router for the API handlers
 * @param {*} dependencies
 */
function router(dependencies) {
  let basicRouter = express.Router();
  let docs = {};

  // Find all the API handlers and add them to our Router
  glob
    .sync(__dirname + "/../../api/**/*.js")
    .map((filename) => require(`${filename}`))
    .forEach((handler) => {
      if (handler.path != null) {
        const path = handler.path();
        let method = "get";
        if (handler.method != null) {
          method = handler.method();
        }

        if (handler.docs != null) {
          let apidocs = handler.docs();
          docs[path] = apidocs;
        }
        dependencies.logger.info("API [" + method + "] " + path);
        if (method === "get") {
          basicRouter.get(path, function (req, res) {
            handler.handle(req, res, dependencies);
          });
        } else if (method === "post") {
          basicRouter.post(path, function (req, res) {
            handler.handle(req, res, dependencies);
          });
        } else if (method === "delete") {
          basicRouter.delete(path, function (req, res) {
            handler.handle(req, res, dependencies);
          });
        }
      }
    });

  const swaggerDocument = {
    openapi: "3.0.0",
    info: {
      title: "Stampede API",
      description: "The Stampede REST API",
      termsOfService: "",
      license: {},
    },
    servers: [
      {
        url: dependencies.serverConfig.webURL,
        description: "Stampede server",
      },
    ],
    paths: docs,
  };
  console.dir(swaggerDocument);

  if (dependencies.serverConfig.enableApiDocs == true) {
    basicRouter.use("/api/api-docs", swaggerUi.serve);
    basicRouter.get("/api/api-docs", swaggerUi.setup(swaggerDocument));
  } else {
    basicRouter.get("/api/api-docs", function (req, res) {
      res.send("API Docs not enabled");
    });
  }

  return basicRouter;
}

module.exports.router = router;
