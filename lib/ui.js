"use strict";
const express = require("express");
const glob = require("glob");

/**
 * router
 * @param {*} dependencies
 * @return {*} the router for UI controllers
 */
function router(dependencies) {
  const basicRouter = express.Router();

  // Find all the UI Controllers and add their routes
  glob
    .sync(__dirname + "/../controllers/**/*.js")
    .map(filename => require(`${filename}`))
    .forEach(handler => {
      if (handler.path != null) {
        const path = handler.path();
        let method = "get";
        if (handler.method != null) {
          method = handler.method();
        }
        dependencies.logger.info("UI [" + method + "] " + path);
        if (method === "get") {
          basicRouter.get(path, function(req, res) {
            const sessionID = req.cookies["sSession"];
            let hasValidAdminSession = false;
            if (sessionID != null) {
              hasValidAdminSession = validateSession(dependencies, sessionID);
            }
            req.validAdminSession = hasValidAdminSession;
            if (
              handler.requiresAdmin == null ||
              !handler.requiresAdmin() ||
              (handler.requiresAdmin() && hasValidAdminSession)
            ) {
              handler.handle(req, res, dependencies);
            } else {
              res.writeHead(302, { Location: "/admin/login" });
              res.end();
            }
          });
        } else if (method === "post") {
          basicRouter.post(path, function(req, res) {
            const sessionID = req.cookies["sSession"];
            let hasValidAdminSession = false;
            if (sessionID != null) {
              hasValidAdminSession = validateSession(dependencies, sessionID);
            }
            req.validAdminSession = hasValidAdminSession;
            if (
              handler.requiresAdmin == null ||
              !handler.requiresAdmin() ||
              (handler.requiresAdmin() && hasValidAdminSession)
            ) {
              handler.handle(req, res, dependencies);
            } else {
              res.writeHead(302, { Location: "/admin/login" });
              res.end();
            }
          });
        }
      }
    });

  return basicRouter;
}

/**
 * validateSession
 * @param {*} sessionID
 */
async function validateSession(dependencies, sessionID) {
  const details = await dependencies.cache.admin.fetchSession(sessionID);
  if (details != null) {
    return true;
  } else {
    return false;
  }
}

module.exports.router = router;
