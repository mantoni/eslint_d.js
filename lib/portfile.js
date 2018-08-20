/*eslint no-sync: 0*/
'use strict';

const fs = require('fs');

const homeEnv = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
const dataFile = `${process.env[homeEnv]}/.eslint_d`;

exports.write = function (port, token) {
  fs.writeFileSync(dataFile, `${port} ${token}`);
};

exports.read = function (callback) {
  fs.readFile(dataFile, 'utf8', (err, data) => {
    if (err) {
      callback(null);
      return;
    }
    const parts = data.split(' ');
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
