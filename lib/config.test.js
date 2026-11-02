import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { assert, refute, sinon } from '@sinonjs/referee-sinon';
import { configFile, loadConfig, writeConfig, removeConfig } from './config.js';

describe('lib/config', () => {
  const resolver = {
    base: 'some/base',
    cwd: '/project',
    eslint_config: '',
    bundled: false,
    require: createRequire(import.meta.url)
  };

  context('configFile', () => {
    it('reuses the same file for the same installation and working directory', () => {
      assert.equals(configFile(resolver), configFile({ ...resolver }));
      assert.match(configFile(resolver), /^some\/base\/\.eslint_d-[a-f0-9]+$/);
    });

    it('separates working directories sharing an installation', () => {
      refute.equals(
        configFile(resolver),
        configFile({ ...resolver, cwd: '/other-project' })
      );
    });

    it('separates installations used from the same working directory', () => {
      refute.equals(
        configFile(resolver),
        configFile({ ...resolver, base: 'other/base' })
      );
    });

    it('separates explicit configurations used from the same working directory', () => {
      refute.equals(
        configFile({ ...resolver, eslint_config: '/project/first.config.js' }),
        configFile({
          ...resolver,
          eslint_config: '/project/alternate.config.js'
        })
      );
    });

    it('keeps the resolved working directory if the process changes directory', () => {
      const filename = configFile(resolver);
      sinon.replace(process, 'cwd', sinon.fake.returns('/other-project'));

      assert.equals(configFile(resolver), filename);
    });
  });

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
});
