'use strict';

const path = require('path');
const LRU = require('nanolru');
const resolver = require('./resolver');
const eslint_path = require('./eslint-path');
const files_hash = require('./files-hash');

// Setup LRU cache + error checking user config.
// 10 by default unless ESLINT_D_MAX_INSTANCES env variable is set.
const { ESLINT_D_MAX_INSTANCES } = process.env;
let maxInstances = ESLINT_D_MAX_INSTANCES
  ? Number.parseInt(ESLINT_D_MAX_INSTANCES, 10)
  : 10;

if (!Number.isInteger(maxInstances)) {
  // eslint-disable-next-line max-len
  console.error(new Error(`ESLINT_D_MAX_INSTANCES not a valid integer.  Instead found "${ESLINT_D_MAX_INSTANCES}".  Defaulting back to 10.`));
  maxInstances = 10;
}
if (maxInstances <= 0) {
  // eslint-disable-next-line max-len
  console.error(new Error(`ESLINT_D_MAX_INSTANCES must be greater than 0.  Instead found "${ESLINT_D_MAX_INSTANCES}".  Defaulting back to 10.`));
  maxInstances = 10;
}
const lru_cache = new LRU(maxInstances);

const check_files = [
  'package.json',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

exports.lru_cache = lru_cache;

exports.getCache = getCache;

async function getCache(cwd, eslint_path_arg) {
  let cache = lru_cache.get(cwd);
  if (!cache) {
    cache = createCache(cwd, eslint_path_arg);
    if (cache) {
      cache.filesChanged = await files_hash.filesHash(cwd, check_files);
    }
    return cache;
  }
  const { filesChanged } = cache;
  if (filesChanged && await filesChanged()) {
    clearRequireCache(cwd);
    cache = createCache(cwd, eslint_path_arg);
    cache.filesChanged = filesChanged;
  }
  return cache;
}

function createCache(cwd, eslint_path_arg) {
  const absolute_eslint_path = eslint_path.resolve(cwd, eslint_path_arg);

  if (!absolute_eslint_path) {
    return null;
  }

  return lru_cache.set(cwd, {
    eslint: require(absolute_eslint_path),
    // use chalk from eslint
    chalk: require(resolver.resolve('chalk', {
      paths: [path.dirname(absolute_eslint_path)]
    }))
  });
}

function clearRequireCache(cwd) {
  Object.keys(require.cache)
    .filter(key => key.startsWith(cwd))
    .forEach((key) => {
      delete require.cache[key];
    });
}
