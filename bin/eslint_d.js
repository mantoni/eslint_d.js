#!/usr/bin/env node
'use strict';

function start() {
  require('../lib/launcher')();
}

var cmd = process.argv[2];
if (cmd === 'start') {

  start();

} else {

  var client = require('../lib/client');
  if (cmd === 'restart') {
    client.stop(function () {
      process.nextTick(start);
    });
  } else {
    var commands = ['stop', 'status', 'restart'];
    if (commands.indexOf(cmd) === -1) {
      client.lint(process.argv.slice(2));
    } else {
      client[cmd](process.argv.slice(3));
    }
  }

}
