'use strict';

const resolver = require('./resolver');

exports.resolve = function (cwd, eslintPath) {
  if (!eslintPath) {
    eslintPath = 'eslint';
  }
  try {
    return resolver.resolve(eslintPath, { paths: [cwd] });
  } catch (e) {
    // module not found
    return resolver.resolve(eslintPath);
  }
};
