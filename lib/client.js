'use strict';

const net = require('net');
const portfile = require('./portfile');

function connect(callback) {
  portfile.read((config) => {
    if (!config) {
      callback('Not running');
      return;
    }
    const socket = net.connect(config.port, '127.0.0.1', () => {
      callback(null, socket, config.token);
    });
    socket.once('error', () => {
      process.exitCode = 1;
      callback('Could not connect');
    });
  });
}

exports.stop = function (callback) {
  connect((err, socket, token) => {
    if (err) {
      process.stdout.write(`${err}\n`);
      return;
    }
    socket.end(`${token} stop`, () => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  });
};

exports.status = function () {
  connect((err, socket, token) => {
    if (err) {
      process.stdout.write(`${err}\n`);
      return;
    }
    socket.on('data', (chunk) => {
      process.stdout.write(chunk);
    });
    socket.on('end', () => {
      process.stdout.write('\n');
    });
    socket.end(`${token} status`);
  });
};

function lint(socket, token, args, text) {
  let buf = '';
  socket.on('data', (chunk) => {
    buf += chunk;
    const p = buf.lastIndexOf('\n');
    if (p !== -1) {
      process.stdout.write(buf.substring(0, p + 1));
      buf = buf.substring(p + 1);
    }
  });
  socket.on('end', () => {
    if (buf) {
      if (buf === '# exit 1') {
        process.exitCode = 1;
      } else {
        process.stdout.write(buf);
      }
    }
  });
  const cwd = process.cwd();
  socket.end(`${token} ${JSON.stringify({ cwd, args, text })}`);
}

exports.lint = function (args, text) {
  if (!args.length && !text) {
    process.stdout.write('No files specified\n');
    return;
  }
  connect((err, socket, token) => {
    if (err) {
      if (process.exitCode === 1) {
        process.stdout.write(`${err}\n`);
        return;
      }
      require('./launcher').launch((err, socket, token) => {
        if (err) {
          process.stdout.write(`${err}\n`);
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
