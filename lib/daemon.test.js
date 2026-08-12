import fs from 'node:fs';
import fs_promises from 'node:fs/promises';
import { normalize, resolve } from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import { assert, refute, match, sinon } from '@sinonjs/referee-sinon';
import { configFile } from './config.js';

/**
 * @import {Resolver} from './resolver.js'
 */

describe('lib/daemon', () => {
  const randome_bytes = Buffer.from('token');
  const project = 'test/fixture/v9.0.x';
  const base = resolve(`${project}/node_modules/eslint`);
  let now = Date.now();
  let fs_write_promise;
  let server;
  let watcher;
  let argv;

  /**
   * @type {Resolver}
   */
  const resolverMock = {
    base,
    bundled: false,
    require: sinon.stub()
  };

  function returnThis() {
    // @ts-ignore
    return this;
  }

  beforeEach(() => {
    server = new net.Server();
    sinon.replace(console, 'error', sinon.fake());
    sinon.replace(process, 'on', sinon.fake());
    sinon.replace(process, 'exit', sinon.fake());
    sinon.replace(crypto, 'randomBytes', sinon.fake.returns(randome_bytes));
    sinon.replace(server, 'listen', sinon.fake());
    sinon.replace(server, 'address', sinon.fake.returns({ port: 1234 }));
    sinon.replace(server, 'close', sinon.fake.yields());
    sinon.replace(net, 'createServer', sinon.fake.returns(server));
    fs_write_promise = sinon.promise();
    sinon.replace(
      fs_promises,
      'writeFile',
      sinon.fake.returns(fs_write_promise)
    );
    sinon.replace(fs_promises, 'unlink', sinon.fake.resolves());
    watcher = { on: sinon.fake(returnThis), close: sinon.fake() };
    sinon.replace(fs, 'watch', sinon.fake.returns(watcher));
    sinon.replace(fs, 'readFile', sinon.fake());
    argv = ['node', 'eslint_d', '0', '0', base, 'hash'];
    sinon.replace(process, 'argv', argv);
  });

  function load() {
    return import(`./daemon.js?now=${now++}`);
  }

  it('creates server, listens on port and writes config when ready', async () => {
    await load();

    assert.calledOnceWith(net.createServer, { allowHalfOpen: true });
    assert.calledOnceWith(server.listen, 0, '127.0.0.1', match.func);
    refute.called(fs_promises.writeFile);

    server.listen.callback();

    assert.calledOnceWith(
      fs_promises.writeFile,
      configFile(resolverMock),
      `${randome_bytes.toString('hex')} 1234 ${process.pid} hash`
    );
    refute.called(fs.watch);
  });

  it('watches config file when fs.writeFile succeeded', async () => {
    await load();
    server.listen.callback();

    fs_write_promise.resolve();
    await new Promise(setImmediate);

    assert.calledOnceWith(fs.watch, configFile(resolverMock), {
      persistent: false
    });
  });

  it('logs error runs shutdown if config file write fails', async () => {
    await load();
    server.listen.callback();

    fs_write_promise.reject(new Error('Oh noes!'));
    await new Promise(setImmediate);

    refute.called(fs.watch);
    assert.calledOnceWith(console.error, 'eslint_d: Error: Oh noes!');
    assert.calledOnceWith(server.close, match.func);
    assert.calledOnceWith(fs_promises.unlink, configFile(resolverMock));
    assert.calledOnceWith(process.exit, 0);
  });

  it('runs shutdown on SIGTERM', async () => {
    await load();
    server.listen.callback();
    fs_write_promise.resolve();
    await new Promise(setImmediate);

    const onSigterm = process.on['firstCall'];
    assert.equals(onSigterm.args[0], 'SIGTERM');
    onSigterm.args[1]();
    await new Promise(setImmediate);

    assert.calledOnce(watcher.close);
    assert.calledOnceWith(server.close, match.func);
    assert.calledOnceWith(fs_promises.unlink, configFile(resolverMock));
    assert.calledOnceWith(process.exit, 0);
  });

  context('ppid', () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    });

    it('does not invoke process.kill if ppid is "0"', async () => {
      sinon.replace(process, 'kill', sinon.fake());
      argv[2] = '0';

      await load();
      clock.tick(1000);

      refute.called(process.kill);
    });

    it('invokes process.kill every second if ppid is "1234"', async () => {
      sinon.replace(process, 'kill', sinon.fake());
      argv[2] = '1234';

      await load();
      clock.tick(1000);

      assert.calledOnceWith(process.kill, 1234, 0);
      process.kill['resetHistory']();

      clock.tick(1000);

      assert.calledOnceWith(process.kill, 1234, 0);
    });

    it('runs shutdown if process.kill throws', async () => {
      sinon.replace(process, 'kill', sinon.fake.throws(new Error('Bye!')));
      argv[2] = '1234';

      await load();
      clock.tick(1000);
      await new Promise(setImmediate);

      assert.calledOnceWith(server.close, match.func);
      assert.calledOnceWith(fs_promises.unlink, configFile(resolverMock));
      assert.calledOnceWith(process.exit, 0);
      server.close.resetHistory();
      fs_promises.unlink['resetHistory']();
      process.exit['resetHistory']();

      clock.tick(1000);

      refute.called(server.close);
      refute.called(fs_promises.unlink);
      refute.called(process.exit);
    });
  });

  context('idle', () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    });

    it('does not shutdown automatically if idle is "0"', async () => {
      argv[3] = '0';

      await load();
      clock.tick(24 * 60 * 60 * 1000);
      await new Promise(setImmediate);

      refute.called(server.close);
      refute.called(fs_promises.unlink);
      refute.called(process.exit);
    });

    it('runs shutdown after configured minutes', async () => {
      argv[3] = '2';

      await load();
      clock.tick(2 * 60 * 1000);
      await new Promise(setImmediate);

      assert.calledOnceWith(server.close, match.func);
      assert.calledOnceWith(fs_promises.unlink, configFile(resolverMock));
      assert.calledOnceWith(process.exit, 0);
    });

    it('does not run shutdown if service is invoked', async () => {
      argv[3] = '2';

      await load();
      clock.tick(2 * 60 * 1000 - 1);
      net.createServer['callback'](new net.Socket());
      clock.tick(1);

      refute.called(server.close);
      refute.called(fs_promises.unlink);
      refute.called(process.exit);

      clock.tick(2 * 60 * 1000 - 2);

      refute.called(server.close);
      refute.called(fs_promises.unlink);
      refute.called(process.exit);

      clock.tick(1);
      await new Promise(setImmediate);

      assert.calledOnceWith(server.close, match.func);
      assert.calledOnceWith(fs_promises.unlink, configFile(resolverMock));
      assert.calledOnceWith(process.exit, 0);
    });
  });

  context('process title', () => {
    it('sets process title to "eslint_d" and reads project package.json', async () => {
      await load();

      assert.equals(process.title, 'eslint_d');
      assert.calledOnceWith(
        fs.readFile,
        normalize(`${resolve(project)}/package.json`),
        'utf8'
      );
    });

    it('sets process title to "eslint_d - <cwd>" if project package.json cannot be read', async () => {
      await load();

      fs.readFile['callback'](new Error('Nope!'));

      assert.equals(process.title, `eslint_d - ${process.cwd()}`);
    });

    it('sets process title to "eslint_d - <cwd>" if project package.json is not valid JSON', async () => {
      await load();

      fs.readFile['callback'](null, 'not json');

      assert.equals(process.title, `eslint_d - ${process.cwd()}`);
    });

    it('sets process title to "eslint_d - <cwd>" if project package.json does not have a "name"', async () => {
      await load();

      fs.readFile['callback'](null, '{}');

      assert.equals(process.title, `eslint_d - ${process.cwd()}`);
    });

    it('sets process title to "eslint_d - <name>" of "name" in project package.json', async () => {
      await load();

      fs.readFile['callback'](null, '{"name":"my-project"}');

      assert.equals(process.title, `eslint_d - my-project`);
    });

    it('sets process title to "eslint_d - global" of "name" in project package.json is "eslint_d"', async () => {
      await load();

      fs.readFile['callback'](null, '{"name":"eslint_d"}');

      assert.equals(process.title, `eslint_d - global`);
    });
  });
});
