import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

/**
 * @typedef {Object} Resolver
 * @property {string} base
 * @property {string} cwd
 * @property {string} eslint_config
 * @property {boolean} bundled
 * @property {require} require
 */

/**
 * @returns {Resolver | 'ignore' | 'fail'}
 */
export function createResolver() {
  const require = createRequire(import.meta.url);
  const cwd = process.cwd();
  const local = getLocal();
  let bundled = false;
  let path;

  try {
    path = require.resolve('eslint/package.json', {
      // Allow specific path to eslint with ESLINT_D_ROOT environment variable
      // This is useful for monorepos where the location of node_modules can be more complex
      paths: [
        ...(process.env.ESLINT_D_ROOT ? [process.env.ESLINT_D_ROOT] : []),
        cwd
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
    cwd,
    eslint_config: getEslintConfig(cwd),
    bundled,
    require
  };
}

/**
 * @param {string} cwd
 * @returns {string}
 */
function getEslintConfig(cwd) {
  let config = '';
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--') {
      break;
    }
    const match = /^(?:--config|-c)(?:=(.*))?$/.exec(arg);
    if (match) {
      const filename = match[1] ?? args[++i];
      if (filename) {
        config = resolve(cwd, filename);
      }
    }
  }
  return config;
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
