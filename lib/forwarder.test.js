import net from 'node:net';
import { PassThrough } from 'node:stream';
import fs from 'node:fs/promises';
import supportsColor from 'supports-color';
import { assert, refute, match, sinon } from '@sinonjs/referee-sinon';
import { forwardToDaemon } from './forwarder.js';
import { createResolver } from './resolver.js';

describe('lib/forwarder', () => {
  const resolver = createResolver();
  if (resolver === 'fail' || resolver === 'ignore') {
    throw new Error('Failed to create resolver');
  }
  const config = { token: 'token', port: 123, pid: 456, hash: 'hash' };
  let socket;
  let argv;

  function returnThis() {
    // @ts-ignore
    return this;
  }

  beforeEach(() => {
    socket = new PassThrough();
    sinon.replace(socket, 'write', sinon.fake());
    sinon.replace(socket, 'end', sinon.fake());
    sinon.replace(socket, 'on', sinon.fake(returnThis));
    sinon.replace(net, 'connect', sinon.fake.returns(socket));
    sinon.replace(console, 'error', sinon.fake());
    argv = [process.argv0, 'eslint_d'];
    sinon.replace(process, 'argv', argv);
  });

  context('forwardToDaemon', () => {
    it('connects to 127.0.0.1 on port from config', () => {
      forwardToDaemon(resolver, config);

      assert.calledOnceWith(net.connect, config.port, '127.0.0.1');
    });

    it('writes token, color level, cwd and argv to socket', () => {
      sinon.replace(process, 'cwd', sinon.fake.returns('the/cwd'));

      forwardToDaemon(resolver, config);

      assert.calledOnceWith(
        socket.write,
        `token ${supportsColor.stdout?.['level'] || 0} "the/cwd" ["node","eslint_d"]`
      );
      assert.calledOnce(socket.end);
    });

    it('does not read from stdin by default', () => {
      sinon.replace(process.stdin, 'on', sinon.fake(returnThis));

      forwardToDaemon(resolver, config);

      refute.called(process.stdin.on);
    });

    it('reads from stdin if --stdin is in argv', () => {
      sinon.replace(process.stdin, 'on', sinon.fake(returnThis));
      argv.push('--stdin');

      forwardToDaemon(resolver, config);

      assert.calledThrice(process.stdin.on);
      assert.calledWith(process.stdin.on, 'readable', match.func);
      assert.calledWith(process.stdin.on, 'end', match.func);
      assert.calledWith(process.stdin.on, 'error', match.func);
    });

    it('writes text from stdin to socket', async () => {
      const text = 'text from stdin';
      const stdin = new PassThrough();
      argv.push('--stdin');
      sinon.replaceGetter(process, 'stdin', () => stdin);

      forwardToDaemon(resolver, config);
      stdin.end(text);
      await new Promise(setImmediate);

      assert.calledThrice(socket.write);
      assert.calledWith(socket.write, '\n');
      assert.calledWith(socket.write, text);
    });

    it('forwards socket response to stdout', () => {
      const chunks = ['response ', 'from daemon'];
      sinon.replace(
        socket,
        'read',
        sinon.fake(() => (chunks.length ? chunks.shift() : null))
      );
      sinon.replace(process.stdout, 'write', sinon.fake());

      forwardToDaemon(resolver, config);
      socket.on.firstCall.callback(); // readable
      socket.on.secondCall.callback(); // end

      assert.calledThrice(process.stdout.write);
      assert.calledWith(process.stdout.write, 'resp');
      assert.calledWith(process.stdout.write, 'onse from d');
      assert.calledWith(process.stdout.write, 'aemon');
    });

    it('handles EXIT0 from response', () => {
      const chunks = ['response from daemonEXIT0'];
      sinon.replace(
        socket,
        'read',
        sinon.fake(() => (chunks.length ? chunks.shift() : null))
      );
      sinon.replace(process.stdout, 'write', sinon.fake());

      forwardToDaemon(resolver, config);
      socket.on.firstCall.callback(); // readable
      socket.on.secondCall.callback(); // end

      assert.calledOnceWith(process.stdout.write, 'response from daemon');
      assert.equals(process.exitCode, 0);
      refute.called(console.error);
    });

    it('handles EXIT1 from response', () => {
      const chunks = ['response from daemonEXIT1'];
      sinon.replace(
        socket,
        'read',
        sinon.fake(() => (chunks.length ? chunks.shift() : null))
      );
      sinon.replace(process.stdout, 'write', sinon.fake());

      forwardToDaemon(resolver, config);
      socket.on.firstCall.callback(); // readable
      socket.on.secondCall.callback(); // end

      assert.calledWith(process.stdout.write, 'response from daemon');
      assert.equals(process.exitCode, 1);
      refute.called(console.error);
    });

    it('handles EXIT1 inside response', () => {
      const chunks = ['response EXIT1', ' from daemonEXIT1'];
      sinon.replace(
        socket,
        'read',
        sinon.fake(() => (chunks.length ? chunks.shift() : null))
      );
      sinon.replace(process.stdout, 'write', sinon.fake());

      forwardToDaemon(resolver, config);
      socket.on.firstCall.callback(); // readable
      socket.on.secondCall.callback(); // end

      assert.calledWith(process.stdout.write, 'response ');
      assert.calledWith(process.stdout.write, 'EXIT1 from daemon');
      assert.equals(process.exitCode, 1);
      refute.called(console.error);
    });

    it('logs error and sets exitCode to 1 if response does not end with EXIT marker', () => {
      const chunks = ['response from daemon'];
      sinon.replace(
        socket,
        'read',
        sinon.fake(() => (chunks.length ? chunks.shift() : null))
      );
      sinon.replace(process.stdout, 'write', sinon.fake());

      forwardToDaemon(resolver, config);
      socket.on.firstCall.callback(); // readable
      socket.on.secondCall.callback(); // end

      assert.calledWith(process.stdout.write, 'response from d');
      assert.calledWith(process.stdout.write, 'aemon');
      assert.equals(process.exitCode, 1);
      assert.calledOnceWith(console.error, 'eslint_d: unexpected response');
    });

    it('logs error from stream', () => {
      sinon.replace(fs, 'unlink', sinon.fake.resolves());

      forwardToDaemon(resolver, config);
      socket.on.thirdCall.callback(new Error('Ouch!')); // error

      assert.calledOnceWith(console.error, 'eslint_d: Error: Ouch!');
      assert.equals(process.exitCode, 1);
      refute.called(fs.unlink);
    });

    it('logs ECONNREFUSED error from stream and removes config', () => {
      sinon.replace(fs, 'unlink', sinon.fake.resolves());

      forwardToDaemon(resolver, config);
      const err = new Error('Connection refused');
      err['code'] = 'ECONNREFUSED';
      socket.on.thirdCall.callback(err); // error

      assert.calledOnceWith(
        console.error,
        'eslint_d: Error: Connection refused - removing config'
      );
      assert.equals(process.exitCode, 1);
      assert.calledOnceWith(fs.unlink, `${resolver.base}/.eslint_d`);
    });
  });
});
