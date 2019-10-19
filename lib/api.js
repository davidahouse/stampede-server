'use strict';
let express = require('express');

// API Controllers
const apiGithub = require('../api/github');

function router(serverConf, cache, scm) {
  let basicRouter = express.Router();

  basicRouter.post('/github', function(req, res) {
    apiGithub.handle(req, res, serverConf, cache, scm);
  });

  return basicRouter;
}

module.exports.router = router;
