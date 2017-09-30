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
};

Downloader.prototype.init = function () {

  if (!this.csvPath) {
    console.error('File not found!');
    process.exit();
  }

  this.lr = new LineByLineReader(this.csvPath);
  this.lr.on('line', this.onParserData.bind(this));
};

Downloader.prototype.onParserData = function (line) {

  let data = line.toString();
  let list = data.split(',');
  if (_.isEmpty(list) || _.size(list) < 2) {
    return false;
  }

  this.lr.pause();

  this.download(list[0], list[1]);
};

Downloader.prototype.download = function (url, path) {

  let filePath = this.outputDir + path;

  request(url, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      fs.ensureFile(path, function (err) {
        if (!err) {
          fs.writeFile(filePath,  body);
        }
      });
    }

    this.lr.resume();
  }.bind(this));

};

const app = new Downloader();
app.init();
