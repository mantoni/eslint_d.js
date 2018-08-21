#!/usr/bin/env node
'use strict';

const cmd = process.argv[2];

if (cmd === '-v' || cmd === '--version') {
  console.log('v%s (eslint_d v%s)',
    require('eslint/package.json').version,
    require('../package.json').version);
  return;
}

if (cmd === '-h' || cmd === '--help') {
  const options = require('../lib/options');
  console.log(options.generateHelp());
  return;
}

const client = require('../lib/client');

if (cmd === 'start'
  || cmd === 'stop'
  || cmd === 'restart'
  || cmd === 'status') {
  client[cmd]();
  return;
}

const args = process.argv.slice(2);
if (args.indexOf('--stdin') > -1) {
  let text = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    text += chunk;
  });
  process.stdin.on('end', () => {
    client.lint(args, text);
  });
  return;
}

client.lint(args);
