/*eslint-env mocha*/
'use strict';

const fs = require('fs');
const path = require('path');
const resolve = require('resolve');
const { assert, refute, sinon } = require('@sinonjs/referee-sinon');
const linter = require('../lib/linter');

describe('linter', () => {
  const cwd = process.cwd();

  beforeEach(() => {
    sinon.replace(process, 'chdir', sinon.fake());
  });

  afterEach(() => {
    linter.cache.clear();
  });

  describe('instance caching', () => {

    beforeEach(() => {
      sinon.spy(resolve, 'sync');
    });

    it('reuses instance from cache', () => {
      linter.invoke(cwd, ['--stdin'], '\'use strict\';', 1234);
      const cache1 = linter.cache.get(cwd);
      linter.invoke(cwd, ['--stdin'], '\'use strict\';', 1234);
      const cache2 = linter.cache.get(cwd);

      assert.equals(linter.cache.length, 1);
      assert.same(cache1, cache2, 'Cache recreated');
      assert.same(cache1.eslint, cache2.eslint);
      assert.calledTwice(resolve.sync);
      assert.calledWithMatch(resolve.sync, 'eslint', { basedir: cwd });
      assert.calledWith(resolve.sync, 'chalk');
    });

    it('uses new instance for different directory', () => {
      const cwd2 = path.join(cwd, 'test');
      linter.invoke(cwd, ['--stdin'], '\'use strict\';');
      linter.invoke(cwd2, ['--stdin'], '\'use strict\';');

      assert.equals(linter.cache.length, 2);
      assert.callCount(resolve.sync, 4);
      assert.calledWithMatch(resolve.sync, 'eslint', { basedir: cwd });
      assert.calledWithMatch(resolve.sync, 'eslint', { basedir: cwd2 });
    });

    it('creates new instance if mtime is larger than first call', () => {
      const now = Date.now();
      const clock = sinon.useFakeTimers(now);
      linter.invoke(cwd, ['--stdin'], '\'use strict\';', now - 1000);
      const cache1 = linter.cache.get(cwd);

      clock.tick(1000);
      linter.invoke(cwd, ['--stdin'], '\'use strict\';', now + 500);
      const cache2 = linter.cache.get(cwd);

      assert.equals(linter.cache.length, 1);
      refute.same(cache1, cache2);
      refute.same(cache1.eslint, cache2.eslint, 'require.cache cleared');
      assert.callCount(resolve.sync, 4);
    });

    it('does not create new instance if mtime is lower than last call', () => {
      const now = Date.now();
      const clock = sinon.useFakeTimers(now);
      linter.invoke(cwd, ['--stdin'], '\'use strict\';', now - 1000);
      const cache1 = linter.cache.get(cwd);

      clock.tick(1000);
      linter.invoke(cwd, ['--stdin'], '\'use strict\';', now - 1000);
      const cache2 = linter.cache.get(cwd);

      clock.tick(1000);
      // Newer than initial timestamp, but older than last run. Verifies the
      // timestamp in the cache was renewed.
      linter.invoke(cwd, ['--stdin'], '\'use strict\';', now + 500);
      const cache3 = linter.cache.get(cwd);

      assert.equals(linter.cache.length, 1);
      assert.same(cache1, cache2);
      assert.same(cache2, cache3);
      assert.callCount(resolve.sync, 2);
    });

  });

  describe('getStatus', () => {

    it('has no instances', () => {
      const status = linter.getStatus();

      assert.equals(status, 'No instances cached.');
    });

    it('has one instance', () => {
      linter.invoke(cwd, ['--stdin'], '\'use strict\';');

      const status = linter.getStatus();

      assert.equals(status, 'One instance cached.');
    });

    it('has two instances', () => {
      linter.invoke(cwd, ['--stdin'], '\'use strict\';');
      linter.invoke(path.join(cwd, 'test'), ['--stdin'], '\'use strict\';');

      const status = linter.getStatus();

      assert.equals(status, '2 instances cached.');
    });

  });

  const fixture_fail = `${cwd}/test/fixture/fail.txt`;
  const fixture_warn = `${cwd}/test/fixture/warn.txt`;
  const lib_linter = `${cwd}/lib/linter.js`;

  function withinDirectory(eslint_version, cwd) {

    describe(eslint_version, () => {

      it('has expected eslint version', () => {
        const path = `${cwd}/node_modules/eslint/package.json`;
        // eslint-disable-next-line no-sync
        const { version } = JSON.parse(fs.readFileSync(path, 'utf8'));

        const match = version.match(/^([0-9]+)\.([0-9]+)\.([0-9]+)$/);

        refute.isNull(match);
        const parts = eslint_version.split('.');
        for (let i = 0; i < parts.length; i++) {
          assert.equals(match[i + 1], parts[i]);
        }
      });

      describe('single file', () => {

        it('succeeds on lib/linter.js', () => {
          const out = linter.invoke(cwd, [lib_linter]);

          assert.equals(out, '');
        });

        it('fails on test/fixture/fail.txt', () => {
          const out = linter.invoke(cwd, [fixture_fail, '-f', 'unix']);

          const space = out.indexOf(' ');
          const slash = out.lastIndexOf('/', space);
          const newline = out.indexOf('\n');

          assert.equals(out.substring(slash, space), '/fail.txt:3:13:');
          assert.equals(out.substring(space + 1, newline),
            'Strings must use singlequote. [Error/quotes]');
        });

        it('adds `# exit 1` on failure', () => {
          const out = linter.invoke(cwd, [fixture_fail, '-f', 'unix']);

          assert.equals(out.split('\n').pop(), '# exit 1');
        });

      });

      describe('--stdin', () => {

        it('runs on --stdin text', () => {
          const out = linter.invoke(cwd, ['--stdin', '-f', 'unix'],
            'console.log();');

          assert.equals(out.split('\n').shift(), '<text>:1:1: Use the global '
            + 'form of \'use strict\'. [Error/strict]');
        });

        it('adds `# exit 1` on failure', () => {
          const out = linter.invoke(cwd, ['--stdin'], 'console.log();');

          assert.equals(out.split('\n').pop(), '# exit 1');
        });

      });

      describe('--fix-to-stdout', () => {

        it('returns fixed script', () => {
          const out = linter.invoke(cwd, ['--stdin', '--fix-to-stdout'],
            'console.log( "!" )\n');

          assert.equals(out, 'console.log(\'!\');\n');
        });

        it('fails if --stdin is not given', () => {
          const out = linter.invoke(cwd, ['--fix-to-stdout', '.']);

          assert.equals(out,
            'The --fix-to-stdout option must be used with --stdin.\n# exit 1');
        });

        it('returns input if nothing to fix', () => {
          const out = linter.invoke(cwd, ['--stdin', '--fix-to-stdout'],
            'console.log(\'!\');\n');

          assert.equals(out, 'console.log(\'!\');\n');
        });

      });

      describe('--print-config', () => {

        it('fails with --stdin', () => {
          const out = linter.invoke(cwd, ['--stdin', '--print-config'],
            'console.log( "!" )\n');

          assert.equals(out, 'The --print-config option requires a single file '
            + 'as positional argument.\n# exit 1');
        });

        it('fails with --stdin and positional argument', () => {
          const out = linter.invoke(cwd, ['--stdin', '--print-config', '.'],
            'console.log( "!" )\n');

          assert.equals(out, 'The --print-config option is not available for '
            + 'piped-in code.\n# exit 1');
        });

      });

      describe('--quiet', () => {

        it('prints warnings by default', () => {
          const out = linter.invoke(cwd, [fixture_warn, '-f', 'unix']);

          refute.equals(out, ''); // verify warn.txt prints warnings
          assert.match(out, 'Warning');
          refute.match(out, '# exit 1');
        });

        it('does not print warnings', () => {
          const out = linter.invoke(cwd, ['--quiet', fixture_warn]);

          assert.equals(out, '');
        });

      });

      describe('--max-warnings', () => {

        it('adds `# exit 1` on failure', () => {
          const out = linter.invoke(cwd, [fixture_warn, '--max-warnings', '0']);

          assert.equals(out.split('\n').pop(), '# exit 1');
        });

        it('does not add `# exit 1` if not exceeded', () => {
          const out = linter.invoke(cwd, [fixture_warn, '--max-warnings', '1']);

          refute.equals(out.split('\n').pop(), '# exit 1');
        });

      });

      describe('--color', () => {

        it('enables color by default', () => {
          linter.invoke(cwd, ['--stdin'], '\'use strict\';');

          assert.isTrue(linter.cache.get(cwd).chalk.enabled);
        });

        it('disables color if --no-color is passed', () => {
          linter.invoke(cwd, ['--stdin', '--no-color'], '\'use strict\';');

          assert.isFalse(linter.cache.get(cwd).chalk.enabled);
        });

      });

    });

  }

  withinDirectory('5', cwd);
  withinDirectory('5.0', 'test/fixture/v5.0.x');
  withinDirectory('4.0', 'test/fixture/v4.0.x');

  it('lets eslint handle unknown formatter', () => {
    assert.exception(() => {
      linter.invoke(cwd, ['test/fixture/fail.txt', '-f', 'unknown']);
    }, {
      name: 'Error',
      message: 'There was a problem loading formatter: ./formatters/unknown'
    });
  });

});
