'use strict';

var net = require('net');
var portfile = require('./portfile');

function connect(callback) {
  var port = portfile.read();
  if (port) {
    var socket = net.connect(port, function () {
      callback(null, socket);
    });
    socket.on('error', function () {
      callback('Could not connect');
    });
  } else {
    callback('Not running');
  }
}

exports.stop = function (callback) {
  connect(function (err, socket) {
    if (err) {
      process.stdout.write(err + '\n');
      return;
    }
    socket.end('stop', function () {
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

  function lint(socket) {
    socket.on('data', function (chunk) {
      process.stdout.write(chunk);
    });
    socket.on('end', function () {
      process.stdout.write('\n');
    });
    socket.end(JSON.stringify({
      cwd: process.cwd(),
      args: args,
      text: text
    }));
  }
  connect(function (err, socket) {
    if (err) {
      require('./launcher')(function () {
        connect(function (err, socket) {
          if (err) {
            process.stdout.write(err + '\n');
          } else {
            lint(socket);
          }
        });
      });
    } else {
      lint(socket);
    }
  });
};
