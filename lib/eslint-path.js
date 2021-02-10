'use strict';

const resolver = require('./resolver');

exports.resolve = function (cwd) {
  try {
    return resolver.resolve('eslint', { paths: [cwd] });
  } catch (e) {
    // module not found
    return resolver.resolve('eslint');
  }
};
