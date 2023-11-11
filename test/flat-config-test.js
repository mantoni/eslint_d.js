/*eslint-env mocha*/
'use strict';

const { assert } = require('@sinonjs/referee-sinon');
const api = require('eslint');
const unsupported = require('../node_modules/eslint/lib/unsupported-api');
const caches = require('../lib/caches');
const linter = require('../lib/linter');

describe('flat-config', () => {

  beforeEach(() => {
    caches.lru_cache.clear();
    delete process.env.ESLINT_USE_FLAT_CONFIG;
  });
  afterEach(() => {
    caches.lru_cache.clear();
    delete process.env.ESLINT_USE_FLAT_CONFIG;
  });

  describe('without flat config', () => {
    it('resolves ESLint class', async () => {
      const cache = await caches.getCache(process.cwd());

      assert.equals(typeof cache.eslint.ESLint, typeof api.ESLint);
      assert.isUndefined(cache.eslint.FlatESLint);
    });

    it('runs lint with ESLint class', async () => {
      await linter.invoke(process.cwd(), ['.'], undefined, () => null);
    });
  });

  describe('with flat configV', () => {
    it('resolves FlatESLint class', async () => {
      process.env.ESLINT_USE_FLAT_CONFIG = 'true';

      const cache = await caches.getCache(process.cwd());

      assert.equals(
        typeof cache.eslint.FlatESLint,
        typeof unsupported.FlatESLint
      );
      assert.isUndefined(cache.eslint.ESLint);
    });

    it('runs lint with FlatESLint class', async () => {
      process.env.ESLINT_USE_FLAT_CONFIG = 'true';
      await linter.invoke(process.cwd(), ['.'], undefined, () => null);
    });
  });
});
