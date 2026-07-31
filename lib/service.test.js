import { createRequire } from 'node:module';
import { Socket } from 'node:net';
import debug from 'debug';
import { assert, refute, sinon } from '@sinonjs/referee-sinon';
import { createResolver } from './resolver.js';
import { createService, importChalk, eslintMajorVersion } from './service.js';
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
    const require = createRequire(`${resolver.base}/`);
    const majorVersion = eslintMajorVersion(resolver, require);
    const useChalk = majorVersion < 10;
    const chalk = importChalk(resolver, require);
    const token = 'token';
    let shutdown_promise;
    let eslint_promise;
    let eslint_promises;
    /** @type {Error | null} */
    let chdir_error;
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
      eslint_promises = [eslint_promise];
      shutdown_promise = sinon.promise();
      chdir_error = null;
      sinon.replace(
        eslint,
        'execute',
        sinon.fake(() => eslint_promises.shift())
      );
      sinon.replace(
        process,
        'chdir',
        sinon.fake(() => {
          if (chdir_error) {
            throw chdir_error;
          }
        })
      );
      sinon.replace(debug, 'enable', sinon.fake());
      sinon.replace(debug, 'disable', sinon.fake());
      service = createService(resolver, token, () =>
        shutdown_promise.resolve()
      );
      if (useChalk) {
        chalk.level = '-';
      }
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

    /** Waits for pending promise callbacks to run. */
    function flush() {
      return new Promise(setImmediate);
    }

    it('immediately ends connection if no data is received', () => {
      con.emit('end');

      assert.calledOnceWithExactly(con.end);
      refute.called(con.write);
      refute.called(process.chdir);
      if (useChalk) {
        assert.equals(chalk.level, '-');
      }
    });

    it('immediately ends connection if token does not match', () => {
      send('invalid', LINT_COMMAND, '0', '/', []);

      assert.calledOnceWithExactly(con.end);
      refute.called(con.write);
      refute.called(process.chdir);
      if (useChalk) {
        assert.equals(chalk.level, '-');
      }
    });

    it('sets chalk.level to given color and changes directory', async () => {
      send(token, LINT_COMMAND, '3', '/', []);

      await eslint_promise.resolve(0);
      if (majorVersion < 10) {
        assert.equals(chalk.level, 3);
      }
      assert.calledOnceWith(process.chdir, '/');
    });

    it('replaces stdout with a function that write to the socket', async () => {
      send(token, LINT_COMMAND, '3', '/', []);
      await flush();
      process.stdout.write('test');

      await eslint_promise.resolve(0);
      assert.calledOnceWith(con.write, 'test');
    });

    it('replaces stderr with a function that write to the socket', async () => {
      send(token, LINT_COMMAND, '3', '/', []);
      await flush();
      process.stderr.write('test');

      await eslint_promise.resolve(0);
      assert.calledOnceWith(con.write, 'test');
    });

    it('runs lint requests one at a time', async () => {
      const first_promise = eslint_promise;
      const first_con = con;
      send(token, LINT_COMMAND, '3', '/', []);
      await flush();

      const second_promise = sinon.promise();
      eslint_promises.push(second_promise);
      connect();
      const second_con = con;
      send(token, LINT_COMMAND, '3', '/', []);
      await flush();

      assert.calledOnce(eslint.execute);
      process.stdout.write('first');
      assert.calledOnceWith(first_con.write, 'first');
      refute.called(second_con.write);

      await first_promise.resolve(0);
      await flush();
      assert.calledTwice(eslint.execute);
      process.stdout.write('second');
      assert.calledOnceWith(second_con.write, 'second');

      await second_promise.resolve(0);
      await flush();
    });

    it('handles shutdown while a lint request runs', async () => {
      const lint_promise = eslint_promise;
      send(token, LINT_COMMAND, '3', '/', []);
      await flush();

      connect();
      send(token, SHUTDOWN_COMMAND, '3', '/', []);
      await shutdown_promise;

      assert.calledOnce(eslint.execute);
      await lint_promise.resolve(0);
      await flush();
    });

    it('ends the connection if request setup fails', async () => {
      chdir_error = new Error('Directory not found');
      send(token, LINT_COMMAND, '3', '/', []);
      await flush();

      refute.called(eslint.execute);
      assert.calledOnceWith(con.end, 'Error: Directory not foundEXIT001');
    });

    it('ends the connection if the request is malformed', () => {
      const chunks = ['{'];
      sinon.replace(con, 'read', () => chunks.shift() || null);
      con.emit('readable');
      con.emit('end');

      assert.calledOnce(con.end);
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
      await flush();
      refute.called(con.write);
      assert.calledOnceWith(con.end, 'EXIT000');
    });

    it('ends connection with "EXIT001" if eslint returns 1', async () => {
      send(token, LINT_COMMAND, '3', '/', []);

      await eslint_promise.resolve(1);
      await flush();
      refute.called(con.write);
      assert.calledOnceWith(con.end, 'EXIT001');
    });

    it('ends connection with "EXIT002" if eslint returns 2', async () => {
      send(token, LINT_COMMAND, '3', '/', []);

      await eslint_promise.resolve(2);
      await flush();
      refute.called(con.write);
      assert.calledOnceWith(con.end, 'EXIT002');
    });

    it('ends connection with "EXIT123" if eslint returns 123', async () => {
      send(token, LINT_COMMAND, '3', '/', []);

      await eslint_promise.resolve(123);
      await flush();
      refute.called(con.write);
      assert.calledOnceWith(con.end, 'EXIT123');
    });

    it('ends connection with "EXIT001" if eslint throws', async () => {
      send(token, LINT_COMMAND, '3', '/', []);

      await eslint_promise.reject(new Error('Ouch!'));
      await flush();
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
