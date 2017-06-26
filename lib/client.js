'use strict';

var net = require('net');
var portfile = require('./portfile');

function connect(callback) {
  portfile.read(function (data) {
    if (!data) {
      callback('Not running');
      return;
    }
    var socket = net.connect(data.port, function () {
      callback(null, socket, data.token);
    });
    socket.on('error', function () {
      callback('Could not connect');
    });
  });
}

exports.stop = function (callback) {
  connect(function (err, socket, token) {
    if (err) {
      process.stdout.write(err + '\n');
      return;
    }
    socket.end(token + ' stop', function () {
      if (typeof callback === 'function') {
        callback();
      }
    });
  });
};

exports.status = function () {
  connect(function (err, socket) {
    if (err) {
      process.stdout.write(err + '\n');
      return;
    }
    socket.end(function () {
      process.stdout.write('Running\n');
    });
  });
};

exports.lint = function (args, text) {
  if (!args.length && !text) {
    process.stdout.write('No files specified\n');
    return;
  }

  function lint(socket, token) {
    var buf = '';
    socket.on('data', function (chunk) {
      buf += chunk;
      var p = buf.lastIndexOf('\n');
      if (p !== -1) {
        process.stdout.write(buf.substring(0, p + 1));
        buf = buf.substring(p + 1);
      }
    });
    socket.on('end', function () {
      if (buf) {
        if (buf === '# exit 1') {
          process.exitCode = 1;
        } else {
          process.stdout.write(buf);
        }
      }
    });
    socket.end(token + ' ' + JSON.stringify({
      cwd: process.cwd(),
      args: args,
      text: text
    }));
  }
  connect(function (err, socket, token) {
    if (err) {
      require('./launcher')(function () {
        connect(function (err, socket, token) {
          if (err) {
            process.stdout.write(err + '\n');
          } else {
            lint(socket, token);
          }
        });
      });
    } else {
      lint(socket, token);
    }
  });
};
