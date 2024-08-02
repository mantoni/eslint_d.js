import { normalize, resolve } from 'node:path';
import { assert, refute, match, sinon } from '@sinonjs/referee-sinon';
import { createResolver } from './resolver.js';

describe('lib/resolver', () => {
  afterEach(() => {
    delete process.env.ESLINT_D_MISS;
  });

  function testResolvesFromInstallDirectory() {
    it('resolves base to eslint install directory from cwd', () => {
      const test_dir = resolve('test/fixture/v8.0.x');
      sinon.replace(process, 'cwd', sinon.fake.returns(test_dir));

      const resolver = createResolver();

      refute.isString(resolver);
      assert.isFalse(resolver['bundled']);
      assert.equals(
        resolver['base'],
        normalize(`${test_dir}/node_modules/eslint`)
      );
    });
  }

  context('with "fallback"', () => {
    testResolvesFromInstallDirectory();

    it('resolves base to fallback eslint install directory by default', () => {
      const bundled_base = resolve('node_modules/eslint');
      sinon.replace(process, 'cwd', sinon.fake.returns('/'));

      const resolver = createResolver();

      refute.isString(resolver);
      assert.isTrue(resolver['bundled']);
      assert.equals(resolver['base'], bundled_base);
    });

    it('resolves base to fallback eslint install directory', () => {
      const bundled_base = resolve('node_modules/eslint');
      sinon.replace(process, 'cwd', sinon.fake.returns('/'));
      process.env.ESLINT_D_MISS = 'fallback';

      const resolver = createResolver();

      refute.isString(resolver);
      assert.isTrue(resolver['bundled']);
      assert.equals(resolver['base'], bundled_base);
    });
  });

  context('with "fail"', () => {
    beforeEach(() => {
      process.env.ESLINT_D_MISS = 'fail';
    });

    testResolvesFromInstallDirectory();

    it('returns "fail" if eslint cannot be resolved', () => {
      sinon.replace(console, 'error', sinon.fake());
      sinon.replace(process, 'cwd', sinon.fake.returns('/'));

      const resolver = createResolver();

      assert.equals(resolver, 'fail');
      assert.calledOnceWith(
        console.error,
        match(
          "eslint_d: Failed to resolve eslint - Error: Cannot find module 'eslint/package.json'"
        )
      );
    });
  });

  context('with "ignore"', () => {
    beforeEach(() => {
      process.env.ESLINT_D_MISS = 'ignore';
    });

    testResolvesFromInstallDirectory();

    it('returns "ignore" if eslint fallback cannot be resolved', () => {
      sinon.replace(console, 'error', sinon.fake());
      sinon.replace(process, 'cwd', sinon.fake.returns('/'));

      const resolver = createResolver();

      assert.equals(resolver, 'ignore');
      refute.called(console.error);
    });
  });

  context('with "unknown"', () => {
    beforeEach(() => {
      process.env.ESLINT_D_MISS = 'unknown';
    });

    it('throws validation error ', () => {
      assert.exception(() => createResolver(), {
        message: 'ESLINT_D_MISS must be one of fallback, fail, ignore'
      });
    });
  });
});
