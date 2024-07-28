import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { assert, sinon } from '@sinonjs/referee-sinon';
import { loadConfig, writeConfig, removeConfig } from './config.js';

describe('lib/config', () => {
  const resolver = {
    base: 'some/base',
    bundled: false,
    require: createRequire(import.meta.url)
  };

  context('loadConfig', () => {
    it('reads config file from base', () => {
      sinon.replace(fs, 'readFile', sinon.fake.returns(sinon.promise()));

      loadConfig(resolver);

      assert.calledOnceWith(fs.readFile, 'some/base/.eslint_d', 'utf8');
    });

    it('returns parsed config from file content', async () => {
      sinon.replace(fs, 'readFile', sinon.fake.resolves('token 123 456 hash'));

      const promise = loadConfig(resolver);

      await assert.resolves(promise, {
        token: 'token',
        port: 123,
        pid: 456,
        hash: 'hash'
      });
    });

    it('returns null if readFile rejects', async () => {
      sinon.replace(fs, 'readFile', sinon.fake.rejects());

      const promise = loadConfig(resolver);

      await assert.resolves(promise, null);
    });
  });

  context('writeConfig', () => {
    it('writes given config to config file from resolver base', async () => {
      sinon.replace(fs, 'writeFile', sinon.fake.resolves());

      const config = { token: 'token', port: 123, pid: 456, hash: 'hash' };

      const promise = writeConfig(resolver, config);

      await assert.resolves(promise);
      assert.calledOnceWith(
        fs.writeFile,
        'some/base/.eslint_d',
        'token 123 456 hash'
      );
    });
  });

  context('removeConfig', () => {
    it('unlinks config file from resolver base', async () => {
      sinon.replace(fs, 'unlink', sinon.fake.resolves());

      const promise = removeConfig(resolver);

      await assert.resolves(promise);
      assert.calledOnceWith(fs.unlink, 'some/base/.eslint_d');
    });
  });
});
