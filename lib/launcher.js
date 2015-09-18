'use strict';

var net = require('net');
var portfile = require('../lib/portfile');

function check(callback) {
  var port = portfile.read();
  if (!port) {
    callback(false);
    return;
  }
  var socket = net.connect(port, function () {
    socket.end();
    callback(true);
  });
  socket.on('error', function () {
    callback(false);
  });
}

function wait(callback) {
  check(function (running) {
    if (running) {
      if (typeof callback === 'function') {
        callback(null);
      }
    } else {
      setTimeout(function () {
        wait(callback);
      }, 100);
    }
  });
}

function launch(callback) {
  var spawn = require('child_process').spawn;
  var server = require.resolve('../lib/server');
  var child = spawn('node', [server], {
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore']
  });
  child.unref();
  setTimeout(function () {
    wait(callback);
  }, 100);
}

module.exports = function (callback) {
  check(function (running) {
    if (running) {
      process.stdout.write('Already running\n');
    } else {
      launch(callback);
    }
  });
};
