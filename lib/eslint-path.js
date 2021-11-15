'use strict';

const resolver = require('./resolver');

exports.resolve = function (cwd, eslint_path) {
  if (!eslint_path) {
    eslint_path = 'eslint';
  }
  try {
    return resolver.resolve(eslint_path, { paths: [cwd] });
  } catch (e) {
    // module not found
    return resolver.resolve(eslint_path);
  }
};
