import fs from 'node:fs';
import fs_promises from 'node:fs/promises';
import child_process from 'node:child_process';
import EventEmitter from 'node:events';
import { assert, refute, sinon } from '@sinonjs/referee-sinon';
import { createResolver } from './resolver.js';
import { launchDaemon, stopDaemon } from './launcher.js';

describe('lib/launcher', () => {
  const resolver = createResolver();
  if (resolver === 'fail' || resolver === 'ignore') {
    throw new Error('Failed to create resolver');
  }
  let watcher;

  beforeEach(() => {
    watcher = new EventEmitter();
    watcher['close'] = sinon.fake();
    sinon.replace(fs, 'watch', sinon.fake.returns(watcher));
    sinon.replace(console, 'error', sinon.fake());
  });

  context('launchDaemon', () => {
    const daemon = resolver.require.resolve('./daemon.js');
    let child;
    let read_file_promise;

    beforeEach(() => {
      read_file_promise = sinon.promise();
      sinon.replace(
        fs_promises,
        'readFile',
        sinon.fake.returns(read_file_promise)
      );
      child = { unref: sinon.fake() };
      sinon.replace(child_process, 'spawn', sinon.fake.returns(child));
    });

    afterEach(() => {
      delete process.env.ESLINT_D_PPID;
      delete process.env.ESLINT_D_IDLE;
      process.exitCode = 0;
    });

    it('spawns with defaults and unrefs child', () => {
      launchDaemon(resolver, 'hash');

      assert.calledWith(
        child_process.spawn,
        process.argv0,
        [daemon, '0', '15', resolver.base, 'hash'],
        { detached: true, stdio: 'ignore' }
      );
      assert.calledOnce(child.unref);
    });

    it('spawns with ppid "auto" and idle "0"', () => {
      process.env.ESLINT_D_PPID = 'auto';

      launchDaemon(resolver, 'hash');

      assert.calledWith(child_process.spawn, process.argv0, [
        daemon,
        String(process.ppid),
        '0',
        resolver.base,
        'hash'
      ]);
    });

    it('spawns with specified ppid and idle "0"', () => {
      process.env.ESLINT_D_PPID = '12345';

      launchDaemon(resolver, 'hash');

      assert.calledWith(child_process.spawn, process.argv0, [
        daemon,
        '12345',
        '0',
        resolver.base,
        'hash'
      ]);
    });

    it('fails if ppid is not a number', () => {
      process.env.ESLINT_D_PPID = 'test';

      launchDaemon(resolver, 'hash');

      assert.calledOnceWith(
        console.error,
        'eslint_d: Failed to start daemon – Error: ESLINT_D_PPID must be a number or "auto"'
      );
      assert.equals(process.exitCode, 1);
    });

    it('spawns with specified idle', () => {
      process.env.ESLINT_D_IDLE = '30';

      launchDaemon(resolver, 'hash');

      assert.calledWith(child_process.spawn, process.argv0, [
        daemon,
        '0',
        '30',
        resolver.base,
        'hash'
      ]);
    });

    it('spawns with specified ppid and idle', () => {
      process.env.ESLINT_D_PPID = '12345';
      process.env.ESLINT_D_IDLE = '30';

      launchDaemon(resolver, 'hash');

      assert.calledWith(child_process.spawn, process.argv0, [
        daemon,
        '12345',
        '30',
        resolver.base,
        'hash'
      ]);
    });

    it('fails if idle is not a number', () => {
      process.env.ESLINT_D_IDLE = 'test';

      launchDaemon(resolver, 'hash');

      assert.calledOnceWith(
        console.error,
        'eslint_d: Failed to start daemon – Error: ESLINT_D_IDLE must be a number'
      );
      assert.equals(process.exitCode, 1);
    });

    it('waits for config file to appear and resolves', async () => {
      const promise = launchDaemon(resolver, 'hash');

      assert.calledOnceWith(fs.watch, resolver.base);

      watcher.emit('change', 'rename', '.eslint_d');

      assert.calledOnceWith(watcher.close);
      await Promise.resolve();
      assert.calledOnceWith(fs_promises.readFile, `${resolver.base}/.eslint_d`);

      read_file_promise.resolve('token 123 456 hash');

      await assert.resolves(promise, {
        token: 'token',
        port: 123,
        pid: 456,
        hash: 'hash'
      });
    });

    it('resolves with null and logs error from watcher', async () => {
      const promise = launchDaemon(resolver, 'hash');
      const error = new Error('watcher error');

      watcher.emit('error', error);

      await assert.resolves(promise, null);
      assert.calledOnceWith(
        console.error,
        'eslint_d: Failed to start daemon – Error: watcher error'
      );
      assert.equals(process.exitCode, 1);
    });

    it('resolves with null and logs "No config"', async () => {
      const promise = launchDaemon(resolver, 'hash');
      const error = new Error('read error');

      watcher.emit('change', 'rename', '.eslint_d');
      read_file_promise.reject(error);

      await assert.resolves(promise, null);
      assert.calledOnceWith(
        console.error,
        'eslint_d: Failed to start daemon – No config'
      );
      assert.equals(process.exitCode, 1);
    });
  });

  context('stopDaemon', () => {
    const config = { token: 'token', port: 123, pid: 456, hash: 'hash' };

    beforeEach(() => {
      sinon.replace(fs_promises, 'unlink', sinon.fake.resolves());
    });

    context('without exception', () => {
      beforeEach(() => {
        sinon.replace(process, 'kill', sinon.fake());
      });

      it('kills process with id from config', () => {
        stopDaemon(resolver, config);

        assert.calledWith(process.kill, 456, 'SIGTERM');
      });

      it('does not remove the config', () => {
        stopDaemon(resolver, config);

        refute.called(fs_promises.unlink);
      });

      it('waits for the config to be removed and resolves', async () => {
        const promise = stopDaemon(resolver, config);

        assert.calledOnceWith(fs.watch, resolver.base);

        watcher.emit('change', 'rename', '.eslint_d');

        assert.calledOnceWith(watcher.close);
        await assert.resolves(promise, undefined);
      });
    });

    context('with exception', () => {
      beforeEach(() => {
        const error = new Error('kill error');
        sinon.replace(process, 'kill', sinon.fake.throws(error));
      });

      it('logs an error and removes the config file', async () => {
        const promise = stopDaemon(resolver, config);

        await assert.resolves(promise, undefined);
        assert.calledOnceWith(
          console.error,
          'eslint_d: Error: kill error - removing config'
        );
        assert.calledOnceWith(fs_promises.unlink, `${resolver.base}/.eslint_d`);
      });

      it('does not watch for the config file', () => {
        stopDaemon(resolver, config);

        refute.called(fs.watch);
      });
    });
  });
});
