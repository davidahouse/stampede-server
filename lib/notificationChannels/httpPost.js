"use strict";
const axios = require('axios').default;

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
  notification.id = new Date();

  await axios({
    method: 'post',
    url: postURL,
    data: notification
  })
    .then(function (response) {
      dependencies.logger.verbose("http notification sent to " + postURL);
    })
    .catch(function (error) {
      dependencies.logger.error("Error sending notification: " + error)
    })
}

module.exports.sendNotification = sendNotification;
