## General design notes

### Server responsibilities

#### Redis connection

The server works completely on redis, so a redis connection is required. See below for what is stored in redis. In general this is where we queue jobs, monitor their status and store the recent job history.

#### Web socket interface

The websocket interface is designed to provide a real-time output from the workers. This will utilize the redis publish/subscribe where you can see the output from any node. This will also include a heartbeat when nodes aren't executing a job.

#### Rest interface

The rest interface provides the basic query/interaction with the redis structure. You can manage the jobs here, see history, etc. Anything found in redis will be accessibile here.

#### GitHub integration

You can setup the webhook from github and link this to a specific job. The server looks into the redis structure to see if there is a matching job definition. Note that this integration will essentially copy the job definition and create a new job just for the PR/branch/etc request. This way there is a single job definition that is referenced, but each PR or branch shows up as a different job.

For example:

job_myCoolProject	-> contains the job definition
job_myCoolProject_pr25	-> contains the recent job definition copied from job_myCoolProject and will contain any builds

#### Elastic search

When jobs complete, the job status document should be sent to elastic search for reporting.

#### File storage

This simple file structure should contain the job outputs for specific jobs. The folder structure here should mirror the one from the redis structure:

jobs/<folder>/...<subfolders>.../<job>/<buildnumber>/

This file storage should be available from both the server and worker.

### Redis structure

| key | description |
| ----- | ------ |
| jobs | A list of all the top level folders / jobs. This is a list type and contains either job_<name> or folder_<name> |
| folder_<name> | A sub-folder that can contain folders / jobs. Same format as the root jobs list |
| job_<name> | A single node that contains the JSON document that describes a single job |
| job_<name>_recent | A list of job executions for a particular job. The list contains the build numbers which is used to find the job_<name>_<buildnumber> node |
| job_<name>_<buildnumber> | A single node that contains the JSON document describing a single job execution |
| github_<org>_<repo>_pullrequest | This contains a link to the job that will be executed for any PR detected in the repo |
| github_<org>_<repo>_branch | This contains a link to the job that will be executed for any Branch push detected in the repo |



