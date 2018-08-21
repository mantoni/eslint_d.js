'use strict';

const net = require('net');
const out = require('./out');
const portfile = require('./portfile');

function check(callback) {
  portfile.read((config) => {
    if (!config) {
      callback('Not running');
      return;
    }
    const socket = net.connect(config.port, '127.0.0.1', () => {
      callback(null, socket, config.token);
    });
    socket.once('error', () => {
      callback('Could not connect');
    });
  });
}

function wait(callback) {
  check((err, socket, token) => {
    if (err) {
      setTimeout(() => {
        wait(callback);
      }, 100);
      return;
    }
    if (typeof callback === 'function') {
      callback(null, socket, token);
    } else {
      socket.end();
    }
  });
}

function launch(callback) {
  const env = Object.create(process.env);
  // Force enable color support in `supports-color`. The client adds
  // `--no-color` to disable color if not supported.
  env.FORCE_COLOR = 1;
  const { spawn } = require('child_process');
  const daemon = require.resolve('../lib/daemon');
  const child = spawn('node', [daemon], {
    detached: true,
    env,
    stdio: ['ignore', 'ignore', 'ignore']
  });
  child.unref();
  setTimeout(() => {
    wait(callback);
  }, 100);
}

exports.launch = function (callback) {
  check((err, socket) => {
    if (err) {
      launch(callback);
    } else {
      socket.end();
      out.write('Already running\n');
    }
  });
};
