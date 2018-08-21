'use strict';

process.title = 'eslint_d';

const server = require('./server');
const portfile = require('./portfile');

const instance = server.start();

process.on('exit', () => {
  portfile.unlink();
});
process.on('SIGTERM', () => {
  instance.stop();
});
process.on('SIGINT', () => {
  instance.stop();
});
