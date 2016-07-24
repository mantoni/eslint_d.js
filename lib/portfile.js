/*eslint no-sync: 0*/
'use strict';

var fs = require('fs');

var homeEnv = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
var dataFile = process.env[homeEnv] + '/.eslint_d';

exports.write = function (port, token) {
  fs.writeFileSync(dataFile, port + ' ' + token);
};

exports.read = function () {
  if (fs.existsSync(dataFile)) {
    var data = fs.readFileSync(dataFile, 'utf8').split(' ');
    return {
      port: Number(data[0]),
      token: data[1]
    };
  }
  return null;
};

exports.unlink = function () {
  if (fs.existsSync(dataFile)) {
    fs.unlinkSync(dataFile);
  }
};
