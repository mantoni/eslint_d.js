'use strict';

var fs = require('fs');

var portFile = process.env.HOME + '/.eslint_d_port';

exports.write = function (port) {
  fs.writeFileSync(portFile, String(port));
};

exports.read = function () {
  if (fs.existsSync(portFile)) {
    var data = fs.readFileSync(portFile, 'utf8');
    return Number(data);
  }
  return null;
};

exports.unlink = function () {
  if (fs.existsSync(portFile)) {
    fs.unlinkSync(portFile);
  }
};
