'use strict';

var net = require('net');
var portfile = require('./portfile');
var linter = require('./linter');


var server = net.createServer({
  allowHalfOpen: true
}, function (con) {
  var data = '';
  con.on('data', function (chunk) {
    data += chunk;
  });
  con.on('end', function () {
    if (!data) {
      con.end();
      return;
    }
    if (data === 'stop') {
      con.end();
      server.close();
      return;
    }
    var cwd, args, text;
    if (data.substring(0, 1) === '{') {
      var json = JSON.parse(data);
      cwd = json.cwd;
      args = json.args;
      text = json.text;
    } else {
      var parts = data.split(' ');
      cwd = parts[0];
      args = parts.slice(1);
    }
    try {
      var resultAndExitCode = linter(cwd, args, text);
      var result = resultAndExitCode[0];
      var exitCode = resultAndExitCode[1];
      con.write(result);
      if (exitCode !== 0) {
        con.write('<<EXIT>>');
      }
    } catch (e) {
      con.write(e.toString() + '\n');
    }
    con.end();
  });
});

server.listen(function () {
  var port = server.address().port;
  portfile.write(port);
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
