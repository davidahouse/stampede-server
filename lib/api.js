"use strict";
let express = require("express");
const glob = require("glob");
const chalk = require("chalk");

/**
 * The router for the API handlers
 * @param {*} dependencies
 */
function router(dependencies) {
  let basicRouter = express.Router();

  // Find all the API handlers and add them to our Router
  glob
    .sync(__dirname + "/../api/**/*.js")
    .map(filename => require(`${filename}`))
    .forEach(handler => {
      if (handler.path != null) {
        const path = handler.path();
        let method = "get";
        if (handler.method != null) {
          method = handler.method();
        }
        console.log(chalk.green("API [" + method + "] " + path));
        if (method === "get") {
          basicRouter.get(path, function(req, res) {
            handler.handle(req, res, dependencies);
          });
        } else if (method === "post") {
          basicRouter.post(path, function(req, res) {
            handler.handle(req, res, dependencies);
          });
        }
      }
    });

  return basicRouter;
}

module.exports.router = router;
