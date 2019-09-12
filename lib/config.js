const fs = require('fs')
const yaml = require('js-yaml')

/**
 * initialize
 * @param {*} conf 
 * @param {*} redisClient 
 */
async function initialize(conf, redisClient) {
    // If we have a local path, attempt to initialize our config from there
    if (conf.stampedeConfigPath != null) {
        const tasks = yaml.safeLoad(fs.readFileSync(conf.stampedeConfigPath + '/tasks.yaml'))
        console.dir(tasks)
        for (let index = 0; index < tasks.length; index++) {
            await redisClient.add('stampede-tasks', tasks[index].id)
            await redisClient.store('stampede-tasks-' + tasks[index].id, tasks[index])
        }
    }
}

module.exports.initialize = initialize