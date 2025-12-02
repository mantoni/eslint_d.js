import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { assert, sinon } from '@sinonjs/referee-sinon';
import { configFile, loadConfig, writeConfig, removeConfig } from './config.js';

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

      assert.calledOnceWith(fs.readFile, configFile(resolver), 'utf8');
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

    it('retries reading the file if content was empty', async () => {
      const clock = sinon.useFakeTimers();
      const contents = ['', 'token 123 456 hash'];
      sinon.replace(
        fs,
        'readFile',
        sinon.fake(() => Promise.resolve(contents.shift()))
      );

      const promise = loadConfig(resolver);
      await Promise.resolve();
      assert.calledOnce(fs.readFile);
      clock.tick(50);

      await assert.resolves(promise, {
        token: 'token',
        port: 123,
        pid: 456,
        hash: 'hash'
      });
      assert.calledTwice(fs.readFile);
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
        configFile(resolver),
        'token 123 456 hash'
      );
    });
  });

  context('removeConfig', () => {
    it('unlinks config file from resolver base', async () => {
      sinon.replace(fs, 'unlink', sinon.fake.resolves());

      const promise = removeConfig(resolver);

      await assert.resolves(promise);
      assert.calledOnceWith(fs.unlink, configFile(resolver));
    });
  });

  context('configFile', () => {
    it('returns unique config file path inside temp dir', () => {
      const hash = createHash('sha256');

      hash.update(path.resolve(resolver.base).replace('\\', '/'));

      assert.equals(
        configFile(resolver),
        path.join(os.tmpdir(), `${hash.digest('hex')}.eslint_d`)
      );
    });
  });
});
