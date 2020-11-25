"use strict";
const url = require("url");
const LynnRequest = require("lynn-request");

/**
 * sendNotification
 * @param {*} notification
 */
async function sendNotification(notification, postURL, dependencies) {
  if (postURL == null) {
    return;
  }

  await sendHTTPPost(postURL, notification.notification.payload, dependencies);
}

async function sendHTTPPost(postURL, notification, dependencies) {
  const fullURL = url.parse(postURL);
  notification.id = new Date();

  return new Promise((resolve) => {
    const request = {};
    request.options = {};
    request.title = "sendMessage";
    request.options.protocol = fullURL.protocol;
    request.options.port = fullURL.port;
    request.options.method = "POST";
    request.options.host = fullURL.hostname;
    request.options.path = fullURL.pathname;
    request.options.body = notification;
    const runner = new LynnRequest(request);
    runner.execute(function (result) {
      dependencies.logger.verbose("http notification sent to " + postURL);
      resolve(result);
    });
  });
}

module.exports.sendNotification = sendNotification;
