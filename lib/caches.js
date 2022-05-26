'use strict';

const path = require('path');
const LRU = require('nanolru');
const resolver = require('./resolver');
const eslint_path = require('./eslint-path');
const files_hash = require('./files-hash');

const lru_cache = new LRU(10);
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
