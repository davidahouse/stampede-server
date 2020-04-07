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
    .map((filename) => require(`${filename}`))
    .forEach((handler) => {
      if (handler.path != null) {
        const path = handler.path();
        let method = "get";
        if (handler.method != null) {
          method = handler.method();
        }
        dependencies.logger.info("UI [" + method + "] " + path);
        if (method === "get") {
          basicRouter.get(path, function (req, res) {
            handleGet(handler, req, res, dependencies);
          });
        } else if (method === "post") {
          basicRouter.post(path, function (req, res) {
            handlePost(handler, req, res, dependencies);
          });
        }
      }
    });

  return basicRouter;
}

/**
 * @param {*} handler
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handleGet(handler, req, res, dependencies) {
  const sessionID = req.cookies["sSession"];
  let hasValidAdminSession = false;
  if (sessionID != null) {
    hasValidAdminSession = await validateSession(dependencies, sessionID);
  }
  req.validAdminSession = hasValidAdminSession;
  const owners = await fetchOwners(dependencies);
  if (
    handler.requiresAdmin == null ||
    !handler.requiresAdmin() ||
    (handler.requiresAdmin() && hasValidAdminSession)
  ) {
    handler.handle(req, res, dependencies, owners);
  } else {
    res.writeHead(302, { Location: "/admin/login" });
    res.end();
  }
}

/**
 * handlePost
 * @param {*} handler
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handlePost(handler, req, res, dependencies) {
  const sessionID = req.cookies["sSession"];
  let hasValidAdminSession = false;
  if (sessionID != null) {
    hasValidAdminSession = await validateSession(dependencies, sessionID);
  }
  req.validAdminSession = hasValidAdminSession;
  const owners = await fetchOwners(dependencies);
  if (
    handler.requiresAdmin == null ||
    !handler.requiresAdmin() ||
    (handler.requiresAdmin() && hasValidAdminSession)
  ) {
    handler.handle(req, res, dependencies, owners);
  } else {
    res.writeHead(302, { Location: "/admin/login" });
    res.end();
  }
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

/**
 * fetchOwners
 */
async function fetchOwners(dependencies) {
  const owners = await dependencies.cache.fetchOwners();
  if (owners != null) {
    return owners.sort();
  } else {
    return [];
  }
}

module.exports.router = router;
