const pullRequestEvent = require("../../scm/events/pullRequest.js");
const pushEvent = require("../../scm/events/push.js");
const releaseEvent = require("../../scm/events/release.js");

/**
 * path this handler will serve
 */
function path() {
  return "/admin/executeRepoEvent";
}

/**
 * http method this handler will serve
 */
function method() {
  return "post";
}

/**
 * handle executeTaskSelection
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies, owners) {
  const owner = req.body.owner;
  const repository = req.body.repository;
  const eventID = req.body.eventID;

  const events = await dependencies.cache.fetchRepoEvents(owner, repository);
  let body = null;
  let source = null;
  for (let index = 0; index < events.length; index++) {
    if (events[index].eventID === eventID) {
      source = events[index].source;
      body = events[index].body;
    }
  }

  if (body != null) {
    if (source === "pull-request") {
      await pullRequestEvent.handle(body, eventID, dependencies);
    } else if (source === "branch-push") {
      await pushEvent.handle(body, eventID, dependencies);
    } else if (source === "release") {
      await releaseEvent.handle(body, eventID, dependencies);
    }
  }

  res.render(dependencies.viewsPath + "admin/executeRepoEvent", {
    owners: owners,
    isAdmin: req.validAdminSession,
    owner: req.body.owner,
    repository: req.body.repository,
  });
}

module.exports.path = path;
module.exports.method = method;
module.exports.handle = handle;
