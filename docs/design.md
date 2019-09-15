# Stampede Server Design

## Hooks

The stampede server handles the following events:

- check_suite
- check_run
- pull_request
- push
- release

## Dependencies

- Redis for realtime caching

## Redis Keys

*stampede-tasks*

The list of task ids that are configured in the system.

*stampede-tasks-<id>*

The task info for a single task. Task info consists of the title and the config parameters available for the task.

*stampede-<org>-<repo>-config*

The stampede.yml override for that org/repo. This will get used by the server always if set, otherwise the server
looks into the repo to find the stampede.yml file itself.

*stampede-activebuilds*

A list of active builds in the system. Builds are identified by: <org>-<repo>-<kind>-<identifier>-<buildnumber>. The value of identifier depends
on the type of build: pullrequest, branch or release.

- <org>-<repo>-pullrequest-<prnumber>-<buildnumber>
- <org>-<repo>-branch-<branch>-<buildnumber>
- <org>-<repo>-release-<release>-<buildnumber>

*stampede-activetasks*

A list of the active tasks running in the system. Tasks are identified by: <build identifier>-<tasknumber>-<task id>. Where task number is
the position of the task in the list of tasks, while task id is the unique identifier for the task. Having task number allows for multiple tasks with the
same id but different config to be executed in a single build. Build identifier is defined above in the activebuilds section.

*stampede-<org>-<repo>-<kind>-<identifier>-buildNumber*

The build number for the given kind and identifier. See the active builds section for a description of kind and identifier.

*stampede-nodes*

A set of nodes that have been identified in the system.

