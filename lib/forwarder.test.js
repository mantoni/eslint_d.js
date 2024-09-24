import net from 'node:net';
import { PassThrough } from 'node:stream';
import fs from 'node:fs/promises';
import supportsColor from 'supports-color';
import { assert, refute, match, sinon } from '@sinonjs/referee-sinon';
import { forwardToDaemon, isAlive } from './forwarder.js';
import { createResolver } from './resolver.js';
import { LINT_COMMAND } from './commands.js';

describe('lib/forwarder', () => {
  const resolver = createResolver();
  if (resolver === 'fail' || resolver === 'ignore') {
    throw new Error('Failed to create resolver');
  }
  const config = { token: 'token', port: 123, pid: 456, hash: 'hash' };
  const color_level = supportsColor.stdout?.['level'] || 0;
  let socket;
  let argv;

  function returnThis() {
    // @ts-ignore
    return this;
  }

  function fakeStdin(text) {
    const stdin = new PassThrough();
    stdin.end(text);
    sinon.replaceGetter(process, 'stdin', () => stdin);
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

  context('isAlive', () => {
    it('connects to 127.0.0.1 on port from config', () => {
      isAlive(config);

      assert.calledOnceWith(net.connect, config.port, '127.0.0.1');
    });

    it('handles response without errors', async () => {
      const chunks = [];
      sinon.replace(
        socket,
        'read',
        sinon.fake(() => (chunks.length ? chunks.shift() : null))
      );

      const result = isAlive(config);
      socket.on.getCall(0).callback(); // connect
      await new Promise(setImmediate);
      socket.on.getCall(2).callback(); // readable

      assert.equals(await result, true);
    });

    it('handles ECONNREFUSED', async () => {
      const result = isAlive(config);
      const err = new Error('Connection refused');
      err['code'] = 'ECONNREFUSED';
      socket.on.getCall(1).callback(err); // error

      assert.equals(await result, false);
    });
  });

  context('forwardToDaemon', () => {
    it('connects to 127.0.0.1 on port from config', () => {
      forwardToDaemon(resolver, config);

      assert.calledOnceWith(net.connect, config.port, '127.0.0.1');
    });

    it('writes token, color level, cwd and argv to socket', async () => {
      sinon.replace(process, 'cwd', sinon.fake.returns('the/cwd'));

      forwardToDaemon(resolver, config);
        socket.on.getCall(0).callback(); // connect
        await new Promise(setImmediate);


      assert.calledOnceWith(
        socket.write,
        `["token","${LINT_COMMAND}",${color_level},"the/cwd",[${JSON.stringify(process.argv0)},"eslint_d"]]`
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
      fakeStdin('text from stdin');
      argv.push('--stdin');

      forwardToDaemon(resolver, config);
      await new Promise(setImmediate);
        socket.on.getCall(0).callback(); // connect
        await new Promise(setImmediate);

      assert.calledThrice(socket.write);
      assert.calledWith(socket.write, '\n');
      assert.calledWith(socket.write, 'text from stdin');
    });

    it('forwards socket response to stdout', async () => {
      const chunks = ['response ', 'from daemon'];
      sinon.replace(
        socket,
        'read',
        sinon.fake(() => (chunks.length ? chunks.shift() : null))
      );
      sinon.replace(process.stdout, 'write', sinon.fake());

      forwardToDaemon(resolver, config);
      socket.on.getCall(0).callback(); // connect
      await new Promise(setImmediate);
      socket.on.getCall(2).callback(); // readable
      socket.on.getCall(3).callback(); // end

      assert.calledThrice(process.stdout.write);
      assert.calledWith(process.stdout.write, 're');
      assert.calledWith(process.stdout.write, 'sponse from');
      assert.calledWith(process.stdout.write, ' daemon');
    });

    it('handles "EXIT000" from response', async () => {
      const chunks = ['response from daemonEXIT000'];
      sinon.replace(
        socket,
        'read',
        sinon.fake(() => (chunks.length ? chunks.shift() : null))
      );
      sinon.replace(process.stdout, 'write', sinon.fake());

      forwardToDaemon(resolver, config);
      socket.on.getCall(0).callback(); // connect
      await new Promise(setImmediate);
      socket.on.getCall(2).callback(); // readable
      socket.on.getCall(3).callback(); // end

      assert.calledWith(process.stdout.write, 'response from daemon');
      assert.equals(process.exitCode, 0);
      refute.called(console.error);
    });

    it('handles "EXIT001" from response', async () => {
      const chunks = ['response from daemonEXIT001'];
      sinon.replace(
        socket,
        'read',
        sinon.fake(() => (chunks.length ? chunks.shift() : null))
      );
      sinon.replace(process.stdout, 'write', sinon.fake());

      forwardToDaemon(resolver, config);
      socket.on.getCall(0).callback(); // connect
      await new Promise(setImmediate);
      socket.on.getCall(2).callback(); // readable
      socket.on.getCall(3).callback(); // end

      assert.calledWith(process.stdout.write, 'response from daemon');
      assert.equals(process.exitCode, 1);
      refute.called(console.error);
    });

    it('handles "EXIT123" from response', async () => {
      const chunks = ['response from daemonEXIT123'];
      sinon.replace(
        socket,
        'read',
        sinon.fake(() => (chunks.length ? chunks.shift() : null))
      );
      sinon.replace(process.stdout, 'write', sinon.fake());

      forwardToDaemon(resolver, config);
      socket.on.getCall(0).callback(); // connect
      await new Promise(setImmediate);
      socket.on.getCall(2).callback(); // readable
      socket.on.getCall(3).callback(); // end

      assert.calledWith(process.stdout.write, 'response from daemon');
      assert.equals(process.exitCode, 123);
      refute.called(console.error);
    });

    it('handles "EXIT001" inside response', async () => {
      const chunks = ['response EXIT001', ' from daemonEXIT002'];
      sinon.replace(
        socket,
        'read',
        sinon.fake(() => (chunks.length ? chunks.shift() : null))
      );
      sinon.replace(process.stdout, 'write', sinon.fake());

      forwardToDaemon(resolver, config);
      socket.on.getCall(0).callback(); // connect
      await new Promise(setImmediate);
      socket.on.getCall(2).callback(); // readable
      socket.on.getCall(3).callback(); // end

      assert.calledWith(process.stdout.write, 'response ');
      assert.calledWith(process.stdout.write, 'EXIT001 from daemon');
      assert.equals(process.exitCode, 2);
      refute.called(console.error);
    });

    it('logs error and sets exitCode to 1 if response does not end with EXIT marker', async () => {
      const chunks = ['response from daemon'];
      sinon.replace(
        socket,
        'read',
        sinon.fake(() => (chunks.length ? chunks.shift() : null))
      );
      sinon.replace(process.stdout, 'write', sinon.fake());

      forwardToDaemon(resolver, config);
      socket.on.getCall(0).callback(); // connect
      await new Promise(setImmediate);
      socket.on.getCall(2).callback(); // readable
      socket.on.getCall(3).callback(); // end

      assert.calledWith(process.stdout.write, 'response from');
      assert.calledWith(process.stdout.write, ' daemon');
      assert.equals(process.exitCode, 1);
      assert.calledOnceWith(console.error, 'eslint_d: unexpected response');
    });

    it('logs error from stream', async () => {
      sinon.replace(fs, 'unlink', sinon.fake.resolves());

      forwardToDaemon(resolver, config);
      socket.on.getCall(0).callback(); // connect
      await new Promise(setImmediate);
      socket.on.getCall(4).callback(new Error('Ouch!')); // error

      assert.calledOnceWith(console.error, 'eslint_d: Error: Ouch!');
      assert.equals(process.exitCode, 1);
      refute.called(fs.unlink);
    });

    it('logs ECONNREFUSED error from stream and removes config', async () => {
      sinon.replace(fs, 'unlink', sinon.fake.resolves());

      forwardToDaemon(resolver, config);
      const err = new Error('Connection refused');
      err['code'] = 'ECONNREFUSED';
      socket.on.getCall(1).callback(err); // error
      await Promise.resolve(setImmediate);

      assert.calledOnceWith(
        console.error,
        'eslint_d: Error: Connection refused - removing config'
      );
      assert.equals(process.exitCode, 1);
      assert.calledOnceWith(fs.unlink, `${resolver.base}/.eslint_d`);
    });

    context('--fix-to-stdout', () => {
      beforeEach(() => {
        sinon.replace(process, 'cwd', sinon.fake.returns('cwd'));
        fakeStdin('text from stdin');
      });

      it('throws if --stdin is absent', async () => {
        argv.push('--fix-to-stdout');

        await forwardToDaemon(resolver, config);

        assert.equals(process.exitCode, 1);
        assert.calledOnceWith(
          console.error,
          '--fix-to-stdout requires passing --stdin as well'
        );
      });

      it('replaces the option with --fix-dry-run --format json', async () => {
        argv.push('--stdin', '--fix-to-stdout', '--other', '--options');

        forwardToDaemon(resolver, config);
        await new Promise(setImmediate);
        socket.on.getCall(0).callback(); // connect
        await new Promise(setImmediate);

        assert.calledThrice(socket.write);
        assert.calledWith(
          socket.write,
          `["token","${LINT_COMMAND}",${color_level},"cwd",[${JSON.stringify(process.argv0)},"eslint_d","--stdin","--fix-dry-run","--format","json","--other","--options"]]`
        );
        assert.calledWith(socket.write, '\n');
        assert.calledWith(socket.write, 'text from stdin');
        assert.calledOnce(socket.end);
      });

      it('prints fixed output to stdout', async () => {
        argv.push('--stdin', '--fix-to-stdout');
        const chunks = ['[{"output":"response from daemon"}]EXIT001'];
        sinon.replace(
          socket,
          'read',
          sinon.fake(() => (chunks.length ? chunks.shift() : null))
        );
        sinon.replace(process.stdout, 'write', sinon.fake());

        forwardToDaemon(resolver, config);
        await new Promise(setImmediate);
        socket.on.getCall(0).callback(); // connect
        await new Promise(setImmediate);
        socket.on.getCall(2).callback(); // readable
        socket.on.getCall(3).callback(); // end

        assert.calledWith(process.stdout.write, 'response from daemon');
        assert.equals(process.exitCode, 0);
        refute.called(console.error);
      });

      it('prints original input to stdout if no output', async () => {
        argv.push('--stdin', '--fix-to-stdout');
        const chunks = ['[{}]EXIT000'];
        sinon.replace(
          socket,
          'read',
          sinon.fake(() => (chunks.length ? chunks.shift() : null))
        );
        sinon.replace(process.stdout, 'write', sinon.fake());

        forwardToDaemon(resolver, config);
        await new Promise(setImmediate);
        socket.on.getCall(0).callback(); // connect
        await new Promise(setImmediate);
        socket.on.getCall(2).callback(); // readable
        socket.on.getCall(3).callback(); // end

        assert.calledWith(process.stdout.write, 'text from stdin');
        assert.equals(process.exitCode, 0);
        refute.called(console.error);
      });

      it('prints error to stderr and original input to stdout if output cannot be parsed', async () => {
        argv.push('--stdin', '--fix-to-stdout');
        const chunks = ['NotJSON!EXIT000'];
        sinon.replace(
          socket,
          'read',
          sinon.fake(() => (chunks.length ? chunks.shift() : null))
        );
        sinon.replace(process.stdout, 'write', sinon.fake());

        forwardToDaemon(resolver, config);
        await new Promise(setImmediate);
        socket.on.getCall(0).callback(); // connect
        await new Promise(setImmediate);
        socket.on.getCall(2).callback(); // readable
        socket.on.getCall(3).callback(); // end

        assert.calledWith(process.stdout.write, 'text from stdin');
        assert.equals(process.exitCode, 1);
        let error;
        try {
          JSON.parse('NotJSON!');
        } catch (err) {
          error = err;
        }
        assert.calledOnceWith(console.error, `eslint_d: ${error}`);
      });

      it('logs error and sets exitCode to 1 if response does not end with EXIT marker', async () => {
        argv.push('--stdin', '--fix-to-stdout');
        const chunks = ['response from daemon'];
        sinon.replace(
          socket,
          'read',
          sinon.fake(() => (chunks.length ? chunks.shift() : null))
        );
        sinon.replace(process.stdout, 'write', sinon.fake());

        forwardToDaemon(resolver, config);
        await new Promise(setImmediate);
        socket.on.getCall(0).callback(); // connect
        await new Promise(setImmediate);
        socket.on.getCall(2).callback(); // readable
        socket.on.getCall(3).callback(); // end

        assert.calledWith(process.stdout.write, 'response from daemon');
        assert.equals(process.exitCode, 1);
        assert.calledOnceWith(console.error, 'eslint_d: unexpected response');
      });
    });
  });
});
