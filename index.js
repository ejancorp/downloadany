// May god help me on this challenge..
// Downloading images is not a problem, the problem is how many images is needed to be downloaded..
// I need to download 10Milion
// Site can block you if you spam them, use tor? use proxy list?
// Detecting images before download takes time also
// So how I can speed up the download?
// Download before detect? Let's try...

const fs = require('fs-extra');
const _ = require('lodash');
const LineByLineReader = require('line-by-line');
const GulpUtil = require('gulp-util');
const http = require('http');
const request = require('request');

const Downloader = function () {
  this.outputDir = './output/';
  this.csvPath = GulpUtil.env.file;
  this.lr = null;
  this.lineNumber = 0;
  this.maxBatch = 3;
  this.curBatch = [];
};

Downloader.prototype.init = function () {

  if (!this.csvPath) {
    console.error('File not found!');
    process.exit();
  }

  this.lr = new LineByLineReader(this.csvPath);
  this.lr.on('line', this.onParserData.bind(this));
  this.lr.on('end', this.parseLastData.bind(this));
};

Downloader.prototype.onParserData = function (line) {

  let data = line.toString();
  let list = data.split(',');
  if (_.isEmpty(list) || _.size(list) < 2) {
    return false;
  }

  this.lineNumber++;
  console.log(this.lineNumber, list[0]);
  this.curBatch.push(list);

  if (_.size(this.curBatch) == this.maxBatch)  {
    this.lr.pause();
    this.processBatch();
  }
};

Downloader.prototype.parseLastData = function () {
  this.processBatch();
};

Downloader.prototype.processBatch = function () {

  let promises = [];

  _.each(this.curBatch, function (value, key) {

    let p = new Promise(function (resolve, reject) {

      let url = value[0];
      let filePath = this.outputDir + value[1];

      request(url, function (error, response, body) {

        if (!error && response.statusCode == 200) {
          fs.ensureFile(filePath, function (err) {
            if (!err) {
              fs.writeFile(filePath,  body);
            }
          });
        }

        resolve(url);
      });

    }.bind(this));

    promises.push(p);
  }.bind(this));

  Promise.all(promises).then(function (values) {
    console.log(values);
    this.curBatch = [];
    this.lr.resume();
  }.bind(this));

};

const app = new Downloader();
app.init();
