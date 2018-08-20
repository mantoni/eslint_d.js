'use strict';

const net = require('net');
const portfile = require('../lib/portfile');

function check(callback) {
  portfile.read((data) => {
    if (!data) {
      callback(false);
      return;
    }
    const socket = net.connect(data.port, '127.0.0.1', () => {
      socket.end();
      callback(true);
    });
    socket.on('error', () => {
      callback(false);
    });
  });
}

function wait(callback) {
  check((running) => {
    if (running) {
      if (typeof callback === 'function') {
        callback(null);
      }
    } else {
      setTimeout(() => {
        wait(callback);
      }, 100);
    }
  });
}

function launch(callback) {
  const env = Object.create(process.env);
  // Force enable color support in `supports-color`. The client adds
  // `--no-color` to disable color if not supported.
  env.FORCE_COLOR = 1;
  const spawn = require('child_process').spawn;
  const server = require.resolve('../lib/server');
  const child = spawn('node', [server], {
    detached: true,
    env,
    stdio: ['ignore', 'ignore', 'ignore']
  });
  child.unref();
  setTimeout(() => {
    wait(callback);
  }, 100);
}

module.exports = function (callback) {
  check((running) => {
    if (running) {
      process.stdout.write('Already running\n');
    } else {
      launch(callback);
    }
  });
};
