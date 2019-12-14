"use strict";
let express = require("express");
require("pkginfo")(module);

// API Controllers
const apiGithub = require("../api/github");

function router(serverConf, cache, scm) {
  let basicRouter = express.Router();

  basicRouter.post("/github", function(req, res) {
    apiGithub.handle(req, res, serverConf, cache, scm);
  });

  basicRouter.get("/", function(req, res) {
    statusPage(cache, res);
  });

  return basicRouter;
}

async function statusPage(cache, res) {
  const tasks = await cache.fetchTasks();
  const status =
    "<p>Stampede Server Version: " +
    module.exports.version +
    "</p><BR>" +
    "<p>" +
    tasks.length.toString() +
    " task(s) configured</p>";
  res.send(status);
}

module.exports.router = router;
