'use strict';

const out = require('./out');
const connect = require('./connect');

exports.stop = function (callback) {
  connect((err, socket, token) => {
    if (err) {
      out.write(`${err}\n`);
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
      out.write(`${err}\n`);
      return;
    }
    socket.on('data', (chunk) => {
      out.write(chunk);
    });
    socket.on('end', () => {
      out.write('\n');
    });
    socket.end(`${token} status`);
  });
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
    out.write('No files specified\n');
    return;
  }
  connect((err, socket, token) => {
    if (err) {
      if (process.exitCode === 1) {
        out.write(`${err}\n`);
        return;
      }
      require('./launcher').launch((err, socket, token) => {
        if (err) {
          out.write(`${err}\n`);
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
