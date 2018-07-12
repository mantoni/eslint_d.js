'use strict';

var net = require('net');
var portfile = require('../lib/portfile');

function check(callback) {
  portfile.read(function (data) {
    if (!data) {
      callback(false);
      return;
    }
    var socket = net.connect(data.port, '127.0.0.1', function () {
      socket.end();
      callback(true);
    });
    socket.on('error', function () {
      callback(false);
    });
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
  var env = Object.create(process.env);
  // Force enable color support in `supports-color`. The client adds
  // `--no-color` to disable color if not supported.
  env.FORCE_COLOR = 1;
  var spawn = require('child_process').spawn;
  var server = require.resolve('../lib/server');
  var child = spawn('node', [server], {
    detached: true,
    env: env,
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
