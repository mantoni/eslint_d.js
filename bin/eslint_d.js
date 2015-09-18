#!/usr/bin/env node
'use strict';

function start() {
  require('../lib/launcher')();
}

var cmd = process.argv[2];
if (cmd === 'start') {

  start();

} else {

  var commands = ['stop', 'status', 'restart', 'lint'];
  if (commands.indexOf(cmd) === -1) {
    process.stdout.write('Usage: eslint_d [start|stop|status|restart|lint]\n');
    return;
  }

  var client = require('../lib/client');
  if (cmd === 'restart') {
    client.stop(function () {
      process.nextTick(start);
    });
  } else {
    client[cmd](process.argv.slice(3));
  }
}
