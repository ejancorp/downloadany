const amqp = require('amqplib/callback_api');
const _ = require('lodash');
const GulpUtil = require('gulp-util');
const fs = require('fs-extra');
const request = require('request');

require('dotenv').config()

const Worker = function () {

  this.outputDir = './output/';
  this.endpoint = ['amqp://', process.env.MQusername, ':', process.env.MQpassword, '@', process.env.MQhost, ':', process.env.MQport].join('');
  this.taskName = 'download_image';
  this.connection = null;
  this.channel = null;
  this.lr = null;
};

Worker.prototype.init = function () {

  this.connection = amqp.connect(this.endpoint, this.onConnectQueue.bind(this));
};

Worker.prototype.onConnectQueue = function (error, connection) {

  connection.createChannel(this.onCreateChannel.bind(this));
};

Worker.prototype.onCreateChannel = function (error, channel) {

  this.channel = channel;
  this.channel.assertQueue(this.taskName, {
    durable: true
  });
  this.channel.prefetch(1);

  console.log('[*] Waiting for messages in %s. To exit press CTRL+C', this.taskName);
  this.channel.consume(this.taskName, this.onConsume.bind(this), {
    noAck: false
  });
}

Worker.prototype.onConsume = function (message) {
  this.download(message);
};

Worker.prototype.download = function (message) {

  let content = message.content.toString();
  let value = content.split(',');
  let url = value[0];
  let filePath = this.outputDir + value[1];

  request(url, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      fs.ensureFile(filePath, function (err) {
        if (!err) {
          fs.writeFile(filePath, body);
        }
      });
    }
    console.log(content);
    this.channel.ack(message);
  }.bind(this));

}

const app = new Worker();
app.init();
