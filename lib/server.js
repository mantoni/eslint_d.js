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
    var parts = data.split(' ');
    con.write(linter(parts[0], parts.slice(1)));
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
