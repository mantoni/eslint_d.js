import { createRequire } from 'node:module';
import { dirname } from 'node:path';

/**
 * @typedef {Object} Resolver
 * @property {string} base
 * @property {boolean} bundled
 * @property {require} require
 */

/**
 * @returns {Resolver | 'ignore' | 'fail'}
 */
export function createResolver() {
  const require = createRequire(import.meta.url);
  const local = getLocal();
  let bundled = false;
  let path;

  try {
    path = require.resolve('eslint/package.json', {
      // Allow specific path to eslint with ESLINT_ROOT environment variable
      // This is useful for monorepos where the location of node_modules can be more complex
      paths: [
        ...(process.env.ESLINT_ROOT ? [process.env.ESLINT_ROOT] : []),
        process.cwd()
      ]
    });
  } catch (err) {
    if (local === 'ignore') {
      return 'ignore';
    }
    if (local === 'fail') {
      console.error(`eslint_d: Failed to resolve eslint - ${err}`);
      return 'fail';
    }
    // Fallback to bundled eslint
    path = require.resolve('eslint/package.json');
    bundled = true;
  }
  return {
    base: dirname(path),
    bundled,
    require
  };
}

const local_options = ['fallback', 'fail', 'ignore'];

/**
 * @returns {string}
 */
function getLocal() {
  const env = process.env.ESLINT_D_MISS;
  if (!env) {
    return 'fallback';
  }
  if (local_options.includes(env)) {
    return env;
  }
  throw new Error(`ESLINT_D_MISS must be one of ${local_options.join(', ')}`);
}
