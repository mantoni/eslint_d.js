'use strict';

const out = require('./out');
const connect = require('./connect');

function write(chunk) {
  out.write(chunk);
}

function fail(err) {
  out.write(`${err}\n`);
}

function sendCommand(command, callback) {
  connect((err, socket, token) => {
    if (err) {
      fail(err);
      return;
    }
    socket.on('data', write);
    socket.end(`${token} ${command}`, () => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  });
}

exports.stop = function (callback) {
  sendCommand('stop', callback);
};

exports.status = function () {
  sendCommand('status');
};

function lint(socket, token, args, text) {
  // If color is not supported, pass the `--no-color` switch to eslint. We
  // enforce color support in the daemon with `FORCE_COLOR=1` (see
  // `launcher.js`).
  if (!require('supports-color').stdout) {
    args = ['--no-color'].concat(args);
  }

  let buf = '';
  socket.on('data', (chunk) => {
    buf += chunk;
    const p = buf.lastIndexOf('\n');
    if (p !== -1) {
      out.write(buf.substring(0, p + 1));
      buf = buf.substring(p + 1);
    }
  });
  socket.on('end', () => {
    if (buf) {
      if (buf === '# exit 1') {
        process.exitCode = 1;
      } else {
        out.write(buf);
      }
    }
  });
  const cwd = process.cwd();
  socket.end(`${token} ${JSON.stringify({ cwd, args, text })}`);
}

exports.lint = function (args, text) {
  if (!args.length && !text) {
    fail('No files specified');
    return;
  }
  connect((err, socket, token) => {
    if (err) {
      if (process.exitCode === 1) {
        fail(err);
        return;
      }
      require('./launcher').launch((err, socket, token) => {
        if (err) {
          fail(err);
          process.exitCode = 1;
          return;
        }
        lint(socket, token, args, text);
      });
    } else {
      lint(socket, token, args, text);
    }
  });
};
