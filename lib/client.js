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
    socket.on('error', () => {
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
      process.stdout.write(String(chunk));
    });
    socket.on('end', () => {
      process.stdout.write('\n');
    });
    socket.end(`${token} status`);
  });
};

exports.lint = function (args, text) {
  if (!args.length && !text) {
    process.stdout.write('No files specified\n');
    return;
  }

  function lint(socket, token) {
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
  connect((err, socket, token) => {
    if (err) {
      require('./launcher')(() => {
        connect((err, socket, token) => {
          if (err) {
            process.stdout.write(`${err}\n`);
            return;
          }
          lint(socket, token);
        });
      });
    } else {
      lint(socket, token);
    }
  });
};
