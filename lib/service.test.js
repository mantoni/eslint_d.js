import { Socket } from 'node:net';
import debug from 'debug';
import { assert, refute, sinon } from '@sinonjs/referee-sinon';
import { createResolver } from './resolver.js';
import { createService } from './service.js';
import { LINT_COMMAND, SHUTDOWN_COMMAND } from './commands.js';

describe('lib/service', () => {
  context('createService', () => {
    const original_stdout_write = process.stdout.write;
    const original_stderr_write = process.stderr.write;
    const resolver = createResolver();
    if (resolver === 'fail' || resolver === 'ignore') {
      throw new Error('Failed to create resolver');
    }
    const eslint = resolver.require(`${resolver.base}/lib/cli.js`);
    const chalk = resolver.require('chalk');
    const token = 'token';
    let shutdown_promise;
    let eslint_promise;
    let service;
    let con;

    function connect() {
      con = new Socket({ allowHalfOpen: true });
      sinon.replace(con, 'write', sinon.fake());
      sinon.replace(con, 'end', sinon.fake());
      service(con);
    }

    beforeEach(() => {
      eslint_promise = sinon.promise();
      shutdown_promise = sinon.promise();
      sinon.replace(eslint, 'execute', sinon.fake.returns(eslint_promise));
      sinon.replace(process, 'chdir', sinon.fake());
      sinon.replace(debug, 'enable', sinon.fake());
      sinon.replace(debug, 'disable', sinon.fake());
      service = createService(resolver, token, () =>
        shutdown_promise.resolve()
      );
      chalk.level = '-';
      connect();
    });

    afterEach(() => {
      assert.same(process.stdout.write, original_stdout_write);
      assert.same(process.stderr.write, original_stderr_write);
    });

    it('does not enable debug by default', () => {
      refute.called(debug.enable);
    });

    it('enables debug with DEBUG environment variable', () => {
      sinon.define(process.env, 'DEBUG', 'eslint_d:*');

      service = createService(resolver, token, () =>
        shutdown_promise.resolve()
      );

      assert.calledOnceWith(debug.enable, 'eslint_d:*');
    });

    /**
     * @param {string} request_token
     * @param {string} command
     * @param {string} color_level
     * @param {string} cwd
     * @param {string[]} argv
     * @param {string} [text]
     * @param {string} [DEBUG]
     */
    function send(
      request_token,
      command,
      color_level,
      cwd,
      argv,
      text,
      DEBUG = ''
    ) {
      const chunks = [
        `["${request_token}","${command}",${color_level},`,
        `${JSON.stringify(cwd)},${JSON.stringify(argv)},"${DEBUG}"]`
      ];
      if (text !== undefined) {
        chunks.push(`\n${text}`);
      }
      sinon.replace(con, 'read', () => chunks.shift() || null);
      con.emit('readable');
      con.emit('end');
    }

    it('immediately ends connection if no data is received', () => {
      con.emit('end');

      assert.calledOnceWithExactly(con.end);
      refute.called(con.write);
      refute.called(process.chdir);
      assert.equals(chalk.level, '-');
    });

    it('immediately ends connection if token does not match', () => {
      send('invalid', LINT_COMMAND, '0', '/', []);

      assert.calledOnceWithExactly(con.end);
      refute.called(con.write);
      refute.called(process.chdir);
      assert.equals(chalk.level, '-');
    });

    it('sets chalk.level to given color and changes directory', async () => {
      send(token, LINT_COMMAND, '3', '/', []);

      await eslint_promise.resolve(0);
      assert.equals(chalk.level, 3);
      assert.calledOnceWith(process.chdir, '/');
    });

    it('replaces stdout with a function that write to the socket', async () => {
      send(token, LINT_COMMAND, '3', '/', []);
      process.stdout.write('test');

      await eslint_promise.resolve(0);
      assert.calledOnceWith(con.write, 'test');
    });

    it('replaces stderr with a function that write to the socket', async () => {
      send(token, LINT_COMMAND, '3', '/', []);
      process.stderr.write('test');

      await eslint_promise.resolve(0);
      assert.calledOnceWith(con.write, 'test');
    });

    it('invokes eslint.execute with given args and no text', async () => {
      send(token, LINT_COMMAND, '3', '/', ['--fix']);

      await eslint_promise.resolve(0);
      assert.calledOnceWith(eslint.execute, ['--fix'], null, true);
    });

    it('invokes eslint.execute with given text', async () => {
      send(token, LINT_COMMAND, '3', '/', [], 'some text');

      await eslint_promise.resolve(0);
      assert.calledOnceWith(eslint.execute, [], 'some text', true);
    });

    it('ends connection with "EXIT000" if eslint returns 0', async () => {
      send(token, LINT_COMMAND, '3', '/', []);

      await eslint_promise.resolve(0);
      refute.called(con.write);
      assert.calledOnceWith(con.end, 'EXIT000');
    });

    it('ends connection with "EXIT001" if eslint returns 1', async () => {
      send(token, LINT_COMMAND, '3', '/', []);

      await eslint_promise.resolve(1);
      refute.called(con.write);
      assert.calledOnceWith(con.end, 'EXIT001');
    });

    it('ends connection with "EXIT002" if eslint returns 2', async () => {
      send(token, LINT_COMMAND, '3', '/', []);

      await eslint_promise.resolve(2);
      refute.called(con.write);
      assert.calledOnceWith(con.end, 'EXIT002');
    });

    it('ends connection with "EXIT123" if eslint returns 123', async () => {
      send(token, LINT_COMMAND, '3', '/', []);

      await eslint_promise.resolve(123);
      refute.called(con.write);
      assert.calledOnceWith(con.end, 'EXIT123');
    });

    it('ends connection with "EXIT001" if eslint throws', async () => {
      send(token, LINT_COMMAND, '3', '/', []);

      await eslint_promise.reject(new Error('Ouch!'));
      assert.calledOnceWith(con.write, 'Error: Ouch!');
      assert.calledOnceWith(con.end, 'EXIT001');
    });

    it('shutdown daemon if shutdown command received', async () => {
      send(token, SHUTDOWN_COMMAND, '3', '/', []);

      await shutdown_promise;
    });

    it('does not enable or disable debug by default', async () => {
      send(token, LINT_COMMAND, '3', '/', []);
      await eslint_promise.resolve(0);

      refute.called(debug.enable);
      refute.called(debug.disable);
    });

    it('enables debug if DEBUG is passed', async () => {
      send(token, LINT_COMMAND, '3', '/', [], undefined, 'eslint_d:*');
      await eslint_promise.resolve(0);

      assert.calledOnceWith(debug.enable, 'eslint_d:*');
      refute.called(debug.disable);
    });

    it('disables debug if DEBUG is not passed on subsequent request', async () => {
      send(token, LINT_COMMAND, '3', '/', [], undefined, 'eslint_d:*');
      await eslint_promise.resolve(0);
      debug.enable['resetHistory']();

      connect();
      send(token, LINT_COMMAND, '3', '/', []);
      await new Promise(setImmediate);

      assert.calledOnce(debug.disable);
      refute.called(debug.enable);
    });

    it('does not enable debug if DEBUG is passed and global debug is on', async () => {
      sinon.define(process.env, 'DEBUG', 'eslint_d:*');

      service = createService(resolver, token, () =>
        shutdown_promise.resolve()
      );
      debug.enable['resetHistory']();

      connect();
      send(token, LINT_COMMAND, '3', '/', [], undefined, 'eslint_d:*');
      await eslint_promise.resolve(0);

      refute.called(debug.enable);
      refute.called(debug.disable);
    });

    it('enables debug if DEBUG is passed and global debug is different', async () => {
      sinon.define(process.env, 'DEBUG', 'eslint_d:*');

      service = createService(resolver, token, () =>
        shutdown_promise.resolve()
      );
      debug.enable['resetHistory']();

      connect();
      send(token, LINT_COMMAND, '3', '/', [], undefined, 'eslint:*');
      await eslint_promise.resolve(0);

      assert.calledOnceWith(debug.enable, 'eslint:*');
      refute.called(debug.disable);
    });

    it('resets debug to global is not passed on subsequent request', async () => {
      sinon.define(process.env, 'DEBUG', 'eslint_d:*');

      service = createService(resolver, token, () =>
        shutdown_promise.resolve()
      );

      connect();
      send(token, LINT_COMMAND, '3', '/', [], undefined, 'eslint:*');
      await eslint_promise.resolve(0);
      debug.enable['resetHistory']();

      connect();
      send(token, LINT_COMMAND, '3', '/', []);
      await new Promise(setImmediate);

      assert.calledOnceWith(debug.enable, 'eslint_d:*');
      refute.called(debug.disable);
    });
  });
});
