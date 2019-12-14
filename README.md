## Stampede server

![npm](https://img.shields.io/npm/v/stampede-server?style=for-the-badge)

A node.js workflow server.

To install the server:

```
npm install -g stampede-server
```

Configuring the server can be done by creating a config file at ~/.stampederc, or it can be anywhere and you pass it
to the server when you start it:

```
stampede-server --config myserverrc
```

The contents of the config file are in this format:

config param=config value

The configuration parameters are:

| Config                                                                   | Default   | Description                                                                              |
| ------------------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------- |
| redisHost                                                                | localhost | The host name for redis                                                                  |
| redisPort                                                                | 6379      | The port for redis                                                                       |
| redisPassword                                                            | null      | The password for redis if needed                                                         |
| githubAppID                                                              | null      | The app id assigned to the app by GitHub                                                 |
| githubAppPEMPath                                                         | null      | Path to the apps PEM file                                                                |
| githubHost                                                               | null      | The url for the github API (for GHE it would be https://yourghehost/api/v3)              |
| notificationQueues                                                       | null      | The CSV list of notification queues. For example the CLI defaults to stampede-cli, so at |
| a minimum you should configure stampede-cli as a notification queue here |

Example:

githubAppID=42
githubAppPEMPath=/securestuff/MYPEM.pem
githubHost=https://ourghe/api/v3
redisHost=localhost
stampedeConfigPath=/stampedestuff
notificationQueues=stampede-cli
