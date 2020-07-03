const repositoryBuild = require("repositoryBuild");

async function handle(dependencies) {
  const currentDate = new Date();
  logger.verbose(
    "Checking for any builds that need to be started at hour " +
      currentDate.getHours() +
      " minute " +
      currentDate.getMinutes()
  );
  // loop through any scheduled builds defined in the system
  // check the last run date and if a different date then check time
  // if we have passed the time to start the build, start it!
  const repositories = await dependencies.db.fetchRepositories();
  for (let index = 0; index < repositories.rows.length; index++) {
    const repositoryBuilds = await cache.repositoryBuilds.fetchRepositoryBuilds(
      repositories.rows[index].owner,
      repositories.rows[index].repository
    );
    if (repositoryBuilds != null) {
      for (
        let buildIndex = 0;
        buildIndex < repositoryBuilds.length;
        buildIndex++
      ) {
        const buildInfo = await dependencies.cache.repositoryBuilds.fetchRepositoryBuild(
          repositories.rows[index].owner,
          repositories.rows[index].repository,
          repositoryBuilds[buildIndex]
        );
        if (
          buildInfo.schedule != null &&
          (buildInfo.lastExecuteDate == null ||
            new Date(buildInfo.lastExecuteDate).getDate() !=
              currentDate.getDate() ||
            new Date(buildInfo.lastExecuteDate).getMonth() !=
              currentDate.getMonth() ||
            new Date(buildInfo.lastExecuteDate).getFullYear() !=
              currentDate.getFullYear())
        ) {
          if (
            currentDate.getHours() >= buildInfo.schedule.hour &&
            currentDate.getMinutes() >= buildInfo.schedule.minute
          ) {
            logger.verbose("Executing a repository build:");
            buildInfo.lastExecuteDate = currentDate;
            await dependencies.cache.repositoryBuilds.updateRepositoryBuild(
              repositories.rows[index].owner,
              repositories.rows[index].repository,
              buildInfo
            );
            repositoryBuild.execute(
              repositories.rows[index].owner,
              repositories.rows[index].repository,
              repositoryBuilds[buildIndex],
              buildInfo,
              dependencies
            );
          }
        }
      }
    }
  }
}

module.exports.handle = handle;
