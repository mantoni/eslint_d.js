#!/usr/bin/env node
'use strict';

var net = require('net');
var fs = require('fs');
var eslint = require('eslint');

var engine = new eslint.CLIEngine();
var formatter = engine.getFormatter('compact');

var server = net.createServer({
  allowHalfOpen: true
}, function (con) {
  var data = '';
  con.on('data', function (chunk) {
    data += chunk;
  });
  con.on('end', function () {
    var report = engine.executeOnFiles([data]);
    con.write(formatter(report.results));
    con.end();
  });
});

var portFile = process.env.HOME + '/.eslint_d_port';
server.listen(function () {
  var port = server.address().port;
  fs.writeFileSync(portFile, String(port));
});

process.on('exit', function () {
  fs.unlinkSync(portFile);
});
process.on('SIGTERM', function () {
  process.exit();
});
process.on('SIGINT', function () {
  process.exit();
});
