const amqp = require('amqplib');
const _ = require('lodash');
const GulpUtil = require('gulp-util');
const LineByLineReader = require('line-by-line');

require('dotenv').config()

const Tasks = function () {

  this.csvPath = GulpUtil.env.file;
  this.lineNumber = 0;
  this.endpoint = ['amqp://', process.env.MQusername, ':', process.env.MQpassword, '@', process.env.MQhost, ':', process.env.MQport].join('');
  this.taskName = 'download_image';

  this.connection = null;
  this.channel = null;
  this.lr = null;
  this.message = null;
};

Tasks.prototype.init = function () {

  this.connection = amqp.connect(this.endpoint);
  this.connection.then(this.onConnectQueue.bind(this));
};

Tasks.prototype.onConnectQueue = function (connection) {

  console.log('Connection created...');
  this.connection = connection;
  this.connection.createChannel().then(this.onCreateChannel.bind(this)).finally(this.onFinalClose.bind(this));
  return this.connection;
};

Tasks.prototype.onFinalClose = function () {
  console.log('Closing Connection...');
};

Tasks.prototype.onCreateChannel = function (channel) {

  console.log('Channel created...');
  this.channel = channel;
  this.message = this.channel.assertQueue(this.taskName, {
    durable: true
  });
  this.message.then(this.onMessage.bind(this));
};

Tasks.prototype.onMessage = function () {

  console.log('Sending messages...');
  this.lr = new LineByLineReader(this.csvPath);
  this.lr.on('line', this.onParserData.bind(this));
  this.lr.on('end', this.onParserEnd.bind(this));
};

Tasks.prototype.onParserEnd = function () {

  console.log('Closing channel...');
  this.channel.close();
  console.log('Done...');
};

Tasks.prototype.onParserData = function (line) {

  let data = line.toString();
  let list = data.split(',');
  if (_.isEmpty(list) || _.size(list) < 2) {
    return false;
  }

  this.channel.sendToQueue(this.taskName, Buffer.from(data), {
    deliveryMode: true
  });

  this.lineNumber++;
  console.log(this.lineNumber, list[0]);
};

const app = new Tasks();
app.init();
