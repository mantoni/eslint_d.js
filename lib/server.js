'use strict';

var crypto = require('crypto');
var net = require('net');
var portfile = require('./portfile');
var linter = require('./linter');

var token = crypto.randomBytes(8).toString('hex');

var openConnections = [];

function forceClose(con) {
  con.write('Server is stopping...\n# exit 1');
  con.end();
}

var server = net.createServer({
  allowHalfOpen: true
}, function (con) {
  var data = '';
  con.on('data', function (chunk) {
    data += chunk;
  });
  con.on('end', function () {
    openConnections = openConnections.filter(function (c) {
      return c !== con;
    });
    if (!data) {
      con.end();
      return;
    }
    var p = data.indexOf(' ');
    if (p === -1 || data.substring(0, p) !== token) {
      con.end();
      return;
    }
    data = data.substring(p + 1);
    if (data === 'stop') {
      con.end();
      server.close();
      openConnections.forEach(forceClose);
      return;
    }
    if (data === 'status') {
      con.write(linter.getStatus());
      con.end();
      return;
    }
    var cwd, args, text;
    if (data.substring(0, 1) === '{') {
      var json = JSON.parse(data);
      cwd = json.cwd;
      args = json.args;
      text = json.text;
    } else {
      var newlineIndex = data.indexOf('\n');
      if (newlineIndex >= 0) {
        text = data.slice(newlineIndex + 1);
        data = data.slice(0, newlineIndex);
      }
      var parts = data.split(' ');
      cwd = parts[0];
      args = parts.slice(1);
    }
    try {
      con.write(linter(cwd, args, text));
    } catch (e) {
      con.write(e.toString() + '\n# exit 1');
    }
    con.end();
  });
});

server.on('connection', function (con) {
  openConnections = openConnections.concat([con]);
});

server.listen(0, '127.0.0.1', function () {
  var port = server.address().port;
  portfile.write(port, token);
});

process.on('exit', function () {
  portfile.unlink();
});
process.on('SIGTERM', function () {
  process.exit();
});
process.on('SIGINT', function () {
  process.exit();
});
