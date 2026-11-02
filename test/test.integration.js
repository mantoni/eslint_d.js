import child_process from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { assert, refute } from '@sinonjs/referee-sinon';
import { configFile } from '../lib/config.js';
import { environmentHash } from '../lib/hash.js';

const SUPPORTED_ESLINT_VERSIONS = [
  'v4.0.x',
  'v5.0.x',
  'v6.0.x',
  'v7.0.x',
  'v8.0.x',
  'v9.0.x',
  'v10.0.x-chalk4',
  'v10.0.x-chalk5',
  'v10.0.x-no-chalk'
];

const NO_CHALK_FIXTURE = 'v10.0.x-no-chalk';
const root_chalk = path.resolve('node_modules/chalk');
const root_chalk_hidden = path.resolve('node_modules/.chalk-hidden');

async function hideRootChalk() {
  await fs.rename(root_chalk, root_chalk_hidden);
}

async function restoreRootChalk() {
  await fs.rename(root_chalk_hidden, root_chalk);
}

describe('integration tests', () => {
  const eslint_d = path.resolve('bin/eslint_d.js');
  const require = createRequire(import.meta.url);
  const { version } = require('../package.json');
  const { packages } = require('../package-lock.json');
  const bundled_version = packages['node_modules/eslint'].version;

  /**
   * @param {string[]} args
   * @param {Object} [options]
   * @param {string} [options.cwd]
   * @param {string | null} [options.stdin]
   * @param {string} [options.bin]
   * @param {typeof process.env} [options.env]
   * @returns {Promise<{ error: Error | null, stdout: string, stderr: string }>}
   */
  function run(
    args,
    {
      cwd = process.cwd(),
      stdin = null,
      bin = eslint_d,
      env = process.env
    } = {}
  ) {
    return new Promise((resolve) => {
      const child = child_process.execFile(
        process.argv0,
        [bin, ...args],
        { cwd, env },
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
      const { error, stdout, stderr } = await run(['--help']);

      assert.equals(
        stdout.substring(0, stdout.indexOf('\n')),
        `eslint_d [options] file.js [file.js] [dir]`
      );
      assert.equals(stderr, '');
      assert.isNull(error, stdout);
    });

    it('prints help for -h', async () => {
      const { error, stdout, stderr } = await run(['-h']);

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
      const config = configFile({
        base: `${cwd}/node_modules/eslint`,
        cwd,
        eslint_config: '',
        environment: environmentHash()
      });
      let pid;

      after(unlinkHook(config));

      if (fixture === NO_CHALK_FIXTURE) {
        before(hideRootChalk);
        after(restoreRootChalk);
      }

      it('--version', async () => {
        const { error, stdout, stderr } = await run(['--version'], { cwd });

        assert.equals(
          stdout,
          `eslint_d: v${version}, bundled eslint: v${bundled_version}\n`
        );
        assert.equals(stderr, '');
        assert.isNull(error);
      });

      it('status not running', async () => {
        await assert.rejects(fs.stat(config));

        const { error, stdout, stderr } = await run(['status'], { cwd });

        assert.equals(
          stdout,
          `eslint_d: Not running - local eslint v${eslint_version}\n`
        );
        assert.equals(stderr, '');
        assert.isNull(error);
      });

      it('start', async () => {
        const { error, stdout, stderr } = await run(['start'], { cwd });

        assert.equals(stdout, '');
        assert.equals(stderr, '');
        assert.isNull(error);
        await assert.resolves(fs.stat(config));
      });

      it('status running', async () => {
        const raw = await fs.readFile(config, 'utf8');
        [, , pid] = raw.split(' ');

        const { error, stdout, stderr } = await run(['status'], { cwd });

        assert.equals(
          stdout,
          `eslint_d: Running (${pid}) - local eslint v${eslint_version}\n`
        );
        assert.equals(stderr, '');
        assert.isNull(error);
        refute.exception(() => process.kill(Number(pid), 0));
      });

      it('pass.js', async () => {
        const { error, stdout, stderr } = await run(['../pass.js'], { cwd });

        assert.equals(stdout, '');
        assert.equals(stderr, '');
        assert.isNull(error);
      });

      it('fail.js', async () => {
        const { error, stdout, stderr } = await run(['../fail.js'], { cwd });

        assert.match(stdout, path.normalize('/test/fixture/fail.js'));
        assert.match(stdout, 'Strings must use singlequote');
        refute.isNull(error);
        assert.equals(error?.['code'], 1);
        assert.equals(stderr, '');
      });

      it('--stdin', async () => {
        const { error, stdout, stderr } = await run(['--stdin'], {
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
        const { error, stdout, stderr } = await run(['stop'], { cwd });

        assert.equals(stdout, '');
        assert.equals(stderr, '');
        assert.isNull(error, stdout);
        await assert.rejects(fs.stat(config));
        await new Promise((resolve) => setTimeout(resolve, 50));
        assert.exception(() => process.kill(Number(pid), 0));
      });
    });
  });

  context('projects sharing an eslint installation', () => {
    const fixture = path.resolve('test/fixture/v9.0.x');
    const projects = ['project-a', 'project-b'];
    const bin = path.join(fixture, 'node_modules/eslint/bin/eslint.js');

    afterEach(async () => {
      for (const project of projects) {
        await run(['stop'], { cwd: path.join(fixture, project) });
      }
      await run(['stop', '--config', 'alternate.eslint.config.mjs'], {
        cwd: path.join(fixture, 'project-a')
      });
      await run(['stop', '--config', 'eslint.config.mjs'], {
        cwd: path.join(fixture, 'project-a')
      });
    });

    it('uses each project service configuration across successive requests', async () => {
      for (const [project, file] of [
        ['project-a', 'a.config.ts'],
        ['project-b', 'b.config.ts'],
        ['project-a', 'a.config.ts']
      ]) {
        const cwd = path.join(fixture, project);
        const plain = await run([file], { cwd, bin });
        assert.isNull(plain.error, plain.stdout + plain.stderr);

        const daemon = await run([file], { cwd });
        assert.isNull(daemon.error, daemon.stdout + daemon.stderr);
        assert.equals(daemon.stdout, plain.stdout);
        assert.equals(daemon.stderr, plain.stderr);
      }
    }).timeout(15000);

    it('isolates project services when projects lint concurrently', async () => {
      const results = await Promise.all([
        run(['a.config.ts'], { cwd: path.join(fixture, 'project-a') }),
        run(['b.config.ts'], { cwd: path.join(fixture, 'project-b') })
      ]);

      for (const { error, stdout, stderr } of results) {
        assert.isNull(error, stdout + stderr);
        assert.equals(stdout, '');
        assert.equals(stderr, '');
      }
    }).timeout(15000);

    it('isolates explicit configurations within the same working directory', async () => {
      const cwd = path.join(fixture, 'project-a');
      for (const args of [
        ['a.config.ts'],
        ['--config', 'eslint.config.mjs', 'a.config.ts'],
        ['--config', 'alternate.eslint.config.mjs', 'alternate.config.ts'],
        ['-c=./alternate.eslint.config.mjs', 'alternate.config.ts'],
        ['a.config.ts']
      ]) {
        const plain = await run(args, { cwd, bin });
        assert.isNull(plain.error, plain.stdout + plain.stderr);

        const daemon = await run(args, { cwd });
        assert.isNull(daemon.error, daemon.stdout + daemon.stderr);
        assert.equals(daemon.stdout, plain.stdout);
        assert.equals(daemon.stderr, plain.stderr);
      }
    }).timeout(20000);

    it('selects the same daemon for equivalent explicit configuration paths', async () => {
      const cwd = path.join(fixture, 'project-a');
      await run(['start'], { cwd });
      const default_config = await run(['status'], { cwd });
      assert.match(default_config.stdout, 'eslint_d: Running (');
      const start = await run(
        ['start', '--config', 'alternate.eslint.config.mjs'],
        {
          cwd
        }
      );
      assert.isNull(start.error, start.stdout + start.stderr);
      const initial = await run(
        ['status', '-c', './alternate.eslint.config.mjs'],
        {
          cwd
        }
      );
      assert.match(initial.stdout, 'eslint_d: Running (');
      const equivalent = await run(
        ['status', '--config', path.join(cwd, 'alternate.eslint.config.mjs')],
        { cwd }
      );
      assert.equals(equivalent.stdout, initial.stdout);

      const stop = await run(['stop', '-c=alternate.eslint.config.mjs'], {
        cwd
      });
      assert.isNull(stop.error, stop.stdout + stop.stderr);
      const stopped = await run(
        ['status', '--config', 'alternate.eslint.config.mjs'],
        {
          cwd
        }
      );
      assert.match(stopped.stdout, 'eslint_d: Not running');
      const unchanged = await run(['status'], { cwd });
      assert.equals(unchanged.stdout, default_config.stdout);
    });

    it('stops and restarts one project without affecting the other', async () => {
      const cwd_a = path.join(fixture, 'project-a');
      const cwd_b = path.join(fixture, 'project-b');
      for (const cwd of [cwd_a, cwd_b]) {
        const { error, stdout, stderr } = await run(['start'], { cwd });
        assert.isNull(error, stdout + stderr);
      }
      const initial_a = await run(['status'], { cwd: cwd_a });
      const initial_b = await run(['status'], { cwd: cwd_b });
      assert.match(initial_a.stdout, 'eslint_d: Running (');
      assert.match(initial_b.stdout, 'eslint_d: Running (');
      refute.equals(initial_a.stdout, initial_b.stdout);

      const stop = await run(['stop'], { cwd: cwd_a });
      assert.isNull(stop.error, stop.stdout + stop.stderr);
      const stopped_a = await run(['status'], { cwd: cwd_a });
      assert.match(stopped_a.stdout, 'eslint_d: Not running');
      const running_b = await run(['status'], { cwd: cwd_b });
      assert.equals(running_b.stdout, initial_b.stdout);

      const restart = await run(['restart'], { cwd: cwd_b });
      assert.isNull(restart.error, restart.stdout + restart.stderr);
      const restarted_b = await run(['status'], { cwd: cwd_b });
      assert.match(restarted_b.stdout, 'eslint_d: Running (');
      refute.equals(restarted_b.stdout, initial_b.stdout);
      const still_stopped_a = await run(['status'], { cwd: cwd_a });
      assert.equals(still_stopped_a.stdout, stopped_a.stdout);

      const start = await run(['start'], { cwd: cwd_b });
      assert.equals(start.stdout, 'eslint_d: Already running\n');
      const reused_b = await run(['status'], { cwd: cwd_b });
      assert.equals(reused_b.stdout, restarted_b.stdout);
    });
  });

  context('environments sharing a working directory', () => {
    const cwd = path.resolve('test/fixture/v9.0.x/environment');
    const bin = path.resolve(
      'test/fixture/v9.0.x/node_modules/eslint/bin/eslint.js'
    );
    const development = {
      ...process.env,
      NODE_ENV: 'development',
      ESLINT_D_TEST_RULE: ''
    };
    const production = { ...development, NODE_ENV: 'production' };
    const custom = { ...development, ESLINT_D_TEST_RULE: 'enabled' };
    const args = ['--stdin', '--stdin-filename', 'example.js'];

    afterEach(async () => {
      for (const env of [development, production, custom]) {
        await run(['stop'], { cwd, env });
      }
    });

    it('uses the current NODE_ENV when evaluating configuration', async () => {
      for (const env of [development, production, development]) {
        const stdin = "alert('hello');";
        const plain = await run(args, { cwd, env, stdin, bin });
        assert.equals(
          plain.error?.['code'] ?? 0,
          env.NODE_ENV === 'production' ? 1 : 0
        );

        const daemon = await run(args, { cwd, env, stdin });
        assert.equals(
          daemon.error?.['code'] ?? 0,
          plain.error?.['code'] ?? 0,
          daemon.stdout
        );
        assert.equals(daemon.stdout, plain.stdout);
        assert.equals(daemon.stderr, plain.stderr);
      }
    });

    it('isolates arbitrary variables read by configuration', async () => {
      for (const env of [development, custom, development]) {
        const stdin = 'debugger;';
        const plain = await run(args, { cwd, env, stdin, bin });
        assert.equals(
          plain.error?.['code'] ?? 0,
          env.ESLINT_D_TEST_RULE === 'enabled' ? 1 : 0
        );

        const daemon = await run(args, { cwd, env, stdin });
        assert.equals(
          daemon.error?.['code'] ?? 0,
          plain.error?.['code'] ?? 0,
          daemon.stdout
        );
        assert.equals(daemon.stdout, plain.stdout);
        assert.equals(daemon.stderr, plain.stderr);
      }
    });

    it('keeps concurrent environments independent', async () => {
      const stdin = "alert('hello');";
      const [dev, prod] = await Promise.all([
        run(args, { cwd, env: development, stdin }),
        run(args, { cwd, env: production, stdin })
      ]);

      assert.isNull(dev.error, dev.stdout + dev.stderr);
      assert.equals(dev.stdout, '');
      assert.equals(prod.error?.['code'], 1, prod.stdout + prod.stderr);
      assert.match(prod.stdout, 'no-alert');
      assert.equals(prod.stderr, '');
    });

    it('stops one environment without affecting another', async () => {
      for (const env of [development, production]) {
        const { error, stdout, stderr } = await run(['start'], { cwd, env });
        assert.isNull(error, stdout + stderr);
      }
      const initial = await run(['status'], { cwd, env: production });
      assert.match(initial.stdout, 'eslint_d: Running (');

      await run(['stop'], { cwd, env: development });
      const stopped = await run(['status'], { cwd, env: development });
      assert.match(stopped.stdout, 'eslint_d: Not running');
      const unchanged = await run(['status'], { cwd, env: production });
      assert.equals(unchanged.stdout, initial.stdout);
    });

    it('reuses the same daemon when only DEBUG changes', async () => {
      await run(['start'], { cwd, env: development });
      const initial = await run(['status'], { cwd, env: development });
      assert.match(initial.stdout, 'eslint_d: Running (');
      const debug = await run(['status'], {
        cwd,
        env: { ...development, DEBUG: 'eslint_d:*' }
      });
      assert.isNull(debug.error, debug.stdout + debug.stderr);
      assert.equals(debug.stdout, initial.stdout);
    });
  });

  context('--fix-to-stdout', () => {
    SUPPORTED_ESLINT_VERSIONS.filter(
      (fixture) => fixture !== 'v4.0.x' // v4 misses --fix-dry-run
    ).forEach((fixture) => {
      context(fixture, () => {
        const cwd = path.resolve(`test/fixture/${fixture}`);
        const config = configFile({
          base: `${cwd}/node_modules/eslint`,
          cwd,
          eslint_config: '',
          environment: environmentHash()
        });

        after(unlinkHook(config));

        if (fixture === NO_CHALK_FIXTURE) {
          before(hideRootChalk);
          after(restoreRootChalk);
        }

        const run_args = [
          '--fix-to-stdout',
          '--stdin',
          '--stdin-filename',
          `${cwd}/../foo.js`
        ];

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
            assert.isNull(error);
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
            assert.isNull(error);
          });
        });
      });
    });
  });
});
