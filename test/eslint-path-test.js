/*eslint-env mocha*/
'use strict';

const { assert, sinon } = require('@sinonjs/referee-sinon');
const resolver = require('../lib/resolver');
const eslint_path = require('../lib/eslint-path');

describe('eslint-path', () => {

  beforeEach(() => {
    process.env.ESLINT_D_LOCAL_ESLINT_ONLY = 0;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('without eslint_path', () => {

    it('resolves eslint using the given cwd', () => {
      sinon.replace(resolver, 'resolve', sinon.fake.returns('/some/eslint'));

      const result = eslint_path.resolve('some/cwd');

      assert.calledOnceWith(resolver.resolve, 'eslint', {
        paths: ['some/cwd']
      });
      assert.equals(result, '/some/eslint');
    });

    it('resolves eslint without given cwd if that failed', () => {

      sinon.replace(resolver, 'resolve', sinon.fake((_, options) => {
        if (options) {
          throw new Error('Module not found');
        }
        return '/some/eslint';
      }));

      const result = eslint_path.resolve('some/cwd');

      assert.calledTwice(resolver.resolve);
      assert.calledWith(resolver.resolve, 'eslint', { paths: ['some/cwd'] });
      assert.calledWithExactly(resolver.resolve, 'eslint');
      assert.equals(result, '/some/eslint');
    });

    describe('when ESLINT_D_LOCAL_ESLINT_ONLY is enabled', () => {
      it('should not resolve a global eslint version', () => {
        process.env.ESLINT_D_LOCAL_ESLINT_ONLY = 1;

        sinon.replace(resolver, 'resolve', sinon.fake(() => {
          throw new Error('Module not found');
        }));

        const result = eslint_path.resolve('some/cwd');

        assert.calledOnce(resolver.resolve);
        assert.calledWith(resolver.resolve, 'eslint', { paths: ['some/cwd'] });
        assert.isUndefined(result);
      });
    });

  });

  describe('with eslint_path', () => {

    it('resolves eslint using the given cwd', () => {
      sinon.replace(resolver, 'resolve',
        sinon.fake.returns('/some/other-eslint-path'));

      const result = eslint_path.resolve('some/cwd', './other-eslint-path');

      assert.calledOnceWith(resolver.resolve, './other-eslint-path', {
        paths: ['some/cwd']
      });
      assert.equals(result, '/some/other-eslint-path');
    });

    it('resolves eslint without given cwd if that failed', () => {
      sinon.replace(resolver, 'resolve', sinon.fake((_, options) => {
        if (options) {
          throw new Error('Module not found');
        }
        return '/some/other-eslint-path';
      }));

      const result = eslint_path.resolve('some/cwd', './other-eslint-path');

      assert.calledTwice(resolver.resolve);
      assert.calledWith(resolver.resolve, './other-eslint-path', {
        paths: ['some/cwd']
      });
      assert.calledWithExactly(resolver.resolve, './other-eslint-path');
      assert.equals(result, '/some/other-eslint-path');
    });

  });
});
