import child_process from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { assert, refute } from '@sinonjs/referee-sinon';

const SUPPORTED_ESLINT_VERSIONS = [
  'v4.0.x',
  'v5.0.x',
  'v6.0.x',
  'v7.0.x',
  'v8.0.x',
  'v9.0.x'
];

describe('integration tests', () => {
  const eslint_d = path.resolve('bin/eslint_d.js');
  const require = createRequire(import.meta.url);
  const { version } = require('../package.json');
  const { packages } = require('../package-lock.json');
  const bundled_version = packages['node_modules/eslint'].version;

  /**
   * @param {string} args
   * @param {Object} [options]
   * @param {string} [options.cwd]
   * @param {string | null} [options.stdin]
   * @returns {Promise<{ error: Error | null, stdout: string, stderr: string }>}
   */
  function run(args, { cwd = process.cwd(), stdin = null } = {}) {
    const bin = path.relative(cwd, eslint_d);

    return new Promise((resolve) => {
      const child = child_process.exec(
        `${bin} ${args}`,
        { cwd },
        (error, stdout, stderr) => resolve({ error, stdout, stderr })
      );
      if (stdin && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }
    });
  }

  /**
   * @param {string} config
   * @returns {() => Promise<void>}
   */
  function unlinkHook(config) {
    return async () => {
      try {
        await fs.unlink(config);
      } catch {
        // ignore
      }
    };
  }

  context('--help', () => {
    it('prints help for --help', async () => {
      const { error, stdout, stderr } = await run('--help');

      assert.equals(
        stdout.substring(0, stdout.indexOf('\n')),
        `eslint_d [options] file.js [file.js] [dir]`
      );
      assert.equals(stderr, '');
      assert.isNull(error, stdout);
    });

    it('prints help for -h', async () => {
      const { error, stdout, stderr } = await run('-h');

      assert.equals(
        stdout.substring(0, stdout.indexOf('\n')),
        `eslint_d [options] file.js [file.js] [dir]`
      );
      assert.equals(stderr, '');
      assert.isNull(error, stdout);
    });
  });

  SUPPORTED_ESLINT_VERSIONS.forEach((fixture) => {
    context(fixture, () => {
      const cwd = path.resolve(`test/fixture/${fixture}`);
      const { version: eslint_version } = require(
        require.resolve('eslint/package.json', { paths: [cwd] })
      );
      const config = `${cwd}/node_modules/eslint/.eslint_d`;
      let pid;

      after(unlinkHook(config));

      it('--version', async () => {
        const { error, stdout, stderr } = await run('--version', { cwd });

        assert.equals(
          stdout,
          `eslint_d: v${version}, bundled eslint: v${bundled_version}\n`
        );
        assert.equals(stderr, '');
        assert.isNull(error);
      });

      it('status not running', async () => {
        await assert.rejects(fs.stat(config));

        const { error, stdout, stderr } = await run('status', { cwd });

        assert.equals(
          stdout,
          `eslint_d: Not running - local eslint v${eslint_version}\n`
        );
        assert.equals(stderr, '');
        assert.isNull(error);
      });

      it('start', async () => {
        const { error, stdout, stderr } = await run('start', { cwd });

        assert.equals(stdout, '');
        assert.equals(stderr, '');
        assert.isNull(error);
        await assert.resolves(fs.stat(config));
      });

      it('status running', async () => {
        const raw = await fs.readFile(config, 'utf8');
        [, , pid] = raw.split(' ');

        const { error, stdout, stderr } = await run('status', { cwd });

        assert.equals(
          stdout,
          `eslint_d: Running (${pid}) - local eslint v${eslint_version}\n`
        );
        assert.equals(stderr, '');
        assert.isNull(error);
        refute.exception(() => process.kill(Number(pid), 0));
      });

      it('pass.js', async () => {
        const { error, stdout, stderr } = await run('../pass.js', { cwd });

        assert.equals(stdout, '');
        assert.equals(stderr, '');
        assert.isNull(error);
      });

      it('fail.js', async () => {
        const { error, stdout, stderr } = await run('../fail.js', { cwd });

        assert.match(stdout, '/test/fixture/fail.js');
        assert.match(stdout, 'Strings must use singlequote');
        refute.isNull(error);
        assert.equals(error?.['code'], 1);
        assert.equals(stderr, '');
      });

      it('--stdin', async () => {
        const { error, stdout, stderr } = await run('--stdin', {
          cwd,
          stdin: `/* eslint quotes: ["error", "single"] */
              console.log("hello");`
        });

        assert.match(stdout, '<text>');
        assert.match(stdout, 'Strings must use singlequote');
        assert.equals(stderr, '');
        refute.isNull(error);
        assert.equals(error?.['code'], 1);
      });

      it('stop', async () => {
        const { error, stdout, stderr } = await run('stop', { cwd });

        assert.equals(stdout, '');
        assert.equals(stderr, '');
        assert.isNull(error, stdout);
        await assert.rejects(fs.stat(config));
        await new Promise((resolve) => setTimeout(resolve, 50));
        assert.exception(() => process.kill(Number(pid), 0));
      });
    });
  });

  context('--fix-to-stdout', () => {
    SUPPORTED_ESLINT_VERSIONS.filter(
      (fixture) => fixture !== 'v4.0.x' // v4 misses --fix-dry-run
    ).forEach((fixture) => {
      context(fixture, () => {
        const cwd = path.resolve(`test/fixture/${fixture}`);
        const config = `${cwd}/node_modules/eslint/.eslint_d`;

        after(unlinkHook(config));

        const run_args = `--fix-to-stdout --stdin --stdin-filename ${cwd}/../foo.js`;

        context('when file only contains fixable problems', () => {
          it('prints input if no change is needed', async () => {
            const stdin = `console.log('Hello eslint');`;
            const { error, stdout, stderr } = await run(run_args, {
              cwd,
              stdin
            });

            assert.equals(stderr, '');
            assert.equals(stdout, stdin);
            assert.isNull(error);
          });

          it('prints fixed output if change is needed', async () => {
            const { error, stdout, stderr } = await run(run_args, {
              cwd,
              stdin: `console.log("Hello eslint");`
            });

            assert.equals(stderr, '');
            assert.equals(stdout, `console.log('Hello eslint');`);
            assert.isNull(error);
          });
        });

        context('when file contains non-fixable problems', () => {
          it('prints input if no change is needed', async () => {
            const stdin = `/* eslint radix: "error" */
            console.log('Hello' + parseInt('087'))`;

            const { error, stdout, stderr } = await run(run_args, {
              cwd,
              stdin
            });

            assert.equals(stderr, '');
            assert.equals(
              stdout,
              `/* eslint radix: "error" */
            console.log('Hello' + parseInt('087'))`
            );
            refute.isNull(error);
            assert.equals(error?.['code'], 1);
          });

          it('prints fixed output if change is needed', async () => {
            const stdin = `/* eslint radix: "error" */
            console.log("Hello" + parseInt('087'))`;

            const { error, stdout, stderr } = await run(run_args, {
              cwd,
              stdin
            });

            assert.equals(stderr, '');
            assert.equals(
              stdout,
              `/* eslint radix: "error" */
            console.log('Hello' + parseInt('087'))`
            );
            refute.isNull(error);
            assert.equals(error?.['code'], 1);
          });
        });
      });
    });
  });
});
