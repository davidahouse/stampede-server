"use strict";
const express = require("express");
const glob = require("glob");
const chalk = require("chalk");

/**
 * router
 * @param {*} dependencies
 * @return {*} the router for UI controllers
 */
function router(dependencies) {
  const basicRouter = express.Router();

  // Find all the UI Controllers and add their routes
  glob
    .sync("controllers/**/*.js")
    .map(filename => require(`../${filename}`))
    .forEach(handler => {
      if (handler.path != null) {
        const path = handler.path();
        let method = "get";
        if (handler.method != null) {
          method = handler.method();
        }
        console.log(chalk.green("UI [" + method + "] " + path));
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
