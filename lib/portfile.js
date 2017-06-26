/*eslint no-sync: 0*/
'use strict';

var fs = require('fs');

var homeEnv = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
var dataFile = process.env[homeEnv] + '/.eslint_d';

exports.write = function (port, token) {
  fs.writeFileSync(dataFile, port + ' ' + token);
};

exports.read = function (callback) {
  fs.readFile(dataFile, 'utf8', function (err, data) {
    if (err) {
      callback(null);
      return;
    }
    var parts = data.split(' ');
    callback({
      port: Number(parts[0]),
      token: parts[1]
    });
  });
};

exports.unlink = function () {
  if (fs.existsSync(dataFile)) {
    fs.unlinkSync(dataFile);
  }
};
