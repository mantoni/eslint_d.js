'use strict';

const resolver = require('./resolver');

exports.resolve = function (cwd, eslint_path) {
  if (!eslint_path) {
    eslint_path = 'eslint';
  }
  try {
    return resolver.resolve(eslint_path, { paths: [cwd] });
  } catch (e) {

    let useOnlyLocal;
    try {
      useOnlyLocal = JSON.parse(process.env.ESLINT_D_LOCAL_ESLINT_ONLY);
    } catch (parseError) {
      useOnlyLocal = false;
    }

    if (useOnlyLocal) {
      return undefined;
    }

    // module not found
    return resolver.resolve(eslint_path);
  }
};
