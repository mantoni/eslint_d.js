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
  const options = require('../lib/options-cliengine');
  console.log(options.generateHelp());
  return;
}

process.env.CORE_D_TITLE = 'eslint_d';
process.env.CORE_D_DOTFILE = '.eslint_d';
process.env.CORE_D_SERVICE = require.resolve('../lib/linter');

const core_d = require('core_d');

if (cmd === 'start'
  || cmd === 'stop'
  || cmd === 'restart'
  || cmd === 'status') {
  core_d[cmd]();
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
    core_d.invoke(args, text);
  });
  return;
}

core_d.invoke(args);
