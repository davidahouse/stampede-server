"use strict";

/**
 * The url path this handler will serve
 */
function path() {
  return "/api/repository/buildKeys";
}

/**
 * handle buildKeys
 * @param {*} req
 * @param {*} res
 * @param {*} dependencies
 */
async function handle(req, res, dependencies) {
  const owner = req.query.owner;
  const repository = req.query.repository;
  const source = req.query.source;

  const buildKeys = await dependencies.db.fetchBuildKeys(
    owner,
    repository,
    source
  );
  const details = await buildKeyList(
    owner,
    repository,
    uniqueBuildKeys(buildKeys.rows),
    dependencies
  );

  res.send(details);
}

function uniqueBuildKeys(buildKeys) {
  const uniqueKeys = [];
  if (buildKeys == null) {
    return uniqueKeys;
  }

  for (let index = 0; index < buildKeys.length; index++) {
    if (!uniqueKeys.includes(buildKeys[index].build_key)) {
      uniqueKeys.push(buildKeys[index].build_key);
    }
  }
  return uniqueKeys;
}

async function buildKeyList(owner, repository, buildKeys, dependencies) {
  const builds = [];
  for (let index = 0; index < buildKeys.length; index++) {
    const recentBuild = await dependencies.db.mostRecentBuild(
      owner,
      repository,
      buildKeys[index]
    );

    if (recentBuild.rows.length > 0) {
      builds.push({
        buildKey: buildKeys[index],
        lastExecuted: recentBuild.rows[0].started_at,
      });
    } else {
      builds.push({
        buildKey: buildKeys[index],
      });
    }
  }
  return builds;
}

/**
 * The OpenAPI docs
 */
function docs() {
  return {
    get: {
      summary: "repository-buildKeys",
      parameters: [
        {
          in: "query",
          name: "owner",
          schema: {
            type: "string",
          },
        },
        {
          in: "query",
          name: "repository",
          schema: {
            type: "string",
          },
        },
        {
          in: "query",
          name: "source",
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "",
        },
      },
    },
  };
}

module.exports.path = path;
module.exports.handle = handle;
module.exports.docs = docs;
