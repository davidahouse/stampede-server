'use strict'
/**
 * handle tasks
 * @param {*} req 
 * @param {*} res 
 * @param {*} redisClient 
 * @param {*} path 
 */
async function handle(req, res, redisClient, path) {
  const tasks = await redisClient.fetchMembers('stampede-tasks', [])
  res.render(path + 'tasks', {tasks: tasks})
}

module.exports.handle = handle