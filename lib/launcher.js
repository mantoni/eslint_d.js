'use strict';

const out = require('./out');
const connect = require('./connect');

function wait(callback) {
  connect((err, socket, token) => {
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
  connect((err, socket) => {
    if (err) {
      launch(callback);
    } else {
      socket.end();
      out.write('Already running\n');
    }
  });
};
