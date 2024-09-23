import { Socket } from 'node:net';
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

    beforeEach(() => {
      eslint_promise = sinon.promise();
      shutdown_promise = sinon.promise();
      sinon.replace(eslint, 'execute', sinon.fake.returns(eslint_promise));
      sinon.replace(process, 'chdir', sinon.fake());
      service = createService(resolver, token, () =>
        shutdown_promise.resolve()
      );
      chalk.level = '-';
      con = new Socket({ allowHalfOpen: true });
      sinon.replace(con, 'write', sinon.fake());
      sinon.replace(con, 'end', sinon.fake());
      service(con);
    });

    afterEach(() => {
      assert.same(process.stdout.write, original_stdout_write);
      assert.same(process.stderr.write, original_stderr_write);
    });

    /**
     * @param {string} request_token
     * @param {string} command
     * @param {string} color_level
     * @param {string} cwd
     * @param {string[]} argv
     * @param {string} [text]
     */
    function send(request_token, command, color_level, cwd, argv, text) {
      const chunks = [
        `["${request_token}",${command ? `"${command}"` : null},${color_level},`,
        `${JSON.stringify(cwd)},${JSON.stringify(argv)}]`
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

    it('shutdown daemon if SHUTDOWN_COMMAND received', async () => {
      send(token, SHUTDOWN_COMMAND, '3', '/', []);

      await shutdown_promise;
    });
  });
});
