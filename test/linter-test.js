/*eslint-env mocha*/
'use strict';

const fs = require('fs');
const path = require('path');
const resolver = require('../lib/resolver');
const semver = require('semver');
const { assert, refute, sinon, match } = require('@sinonjs/referee-sinon');
const linter = require('../lib/linter');

describe('linter', () => {
  const cwd = process.cwd();

  beforeEach(() => {
    sinon.replace(process, 'chdir', sinon.fake());
  });

  afterEach(() => {
    sinon.restore();
    linter.cache.clear();
  });

  describe('instance caching', () => {

    beforeEach(() => {
      sinon.spy(resolver, 'resolve');
    });

    it('reuses instance from cache', async () => {
      await linter.invoke(cwd, ['--stdin'], '\'use strict\';', 'a', () => {});
      const cache1 = linter.cache.get(cwd);
      await linter.invoke(cwd, ['--stdin'], '\'use strict\';', 'a', () => {});
      const cache2 = linter.cache.get(cwd);

      assert.equals(linter.cache.length, 1);
      assert.same(cache1, cache2, 'Cache recreated');
      assert.same(cache1.eslint, cache2.eslint);
      assert.calledTwice(resolver.resolve);
      assert.calledWithMatch(resolver.resolve, 'eslint', { paths: [cwd] });
      assert.calledWith(resolver.resolve, 'chalk');
    });

    it('uses new instance for different directory', async () => {
      const cwd2 = path.join(cwd, 'test');
      await linter.invoke(cwd, ['--stdin'], '\'use strict\';', 'a', () => {});
      await linter.invoke(cwd2, ['--stdin'], '\'use strict\';', 'a', () => {});

      assert.equals(linter.cache.length, 2);
      assert.callCount(resolver.resolve, 4);
      assert.calledWithMatch(resolver.resolve, 'eslint', { paths: [cwd] });
      assert.calledWithMatch(resolver.resolve, 'eslint', { paths: [cwd2] });
    });

    it('creates new instance if hash differs from first call', async () => {
      await linter.invoke(cwd, ['--stdin'], '\'use strict\';', 'a', () => {});
      const cache1 = linter.cache.get(cwd);

      await linter.invoke(cwd, ['--stdin'], '\'use strict\';', 'b', () => {});
      const cache2 = linter.cache.get(cwd);

      assert.equals(linter.cache.length, 1);
      refute.same(cache1, cache2);
      refute.same(cache1.eslint, cache2.eslint, 'require.cache cleared');
      assert.callCount(resolver.resolve, 4);
    });
  });

  describe('getStatus', () => {

    it('has no instances', () => {
      const status = linter.getStatus();

      assert.equals(status, 'No instances cached.');
    });

    it('has one instance', async () => {
      await linter.invoke(cwd, ['--stdin'], '\'use strict\';', 'a', () => {});

      const status = linter.getStatus();

      assert.equals(status, 'One instance cached.');
    });

    it('has two instances', async () => {
      await linter.invoke(cwd, ['--stdin'], '\'use strict\';', 'a', () => {});
      await linter.invoke(path.join(cwd, 'test'), ['--stdin'],
        '\'use strict\';', 'a', () => {});

      const status = linter.getStatus();

      assert.equals(status, '2 instances cached.');
    });

  });

  const plugin_folder = `${cwd}/test/fixture/eslint-plugin`;
  const plugin_eslintrc = `${cwd}/test/plugin.eslintrc`;
  const no_semi_eslintrc = `${cwd}/test/fixture/no-semi.eslintrc`;

  const fixture_fail = `${cwd}/test/fixture/fail.txt`;
  const fixture_warn = `${cwd}/test/fixture/warn.txt`;
  const fixture_es6 = `${cwd}/test/fixture/es6.txt`;
  const lib_linter = `${cwd}/lib/linter.js`;

  function withinDirectory(eslint_version, dir) {

    describe(eslint_version, () => {
      let callback;

      beforeEach(() => {
        callback = sinon.fake();
      });

      it('has expected eslint version', () => {
        const file = `${dir}/node_modules/eslint/package.json`;
        // eslint-disable-next-line no-sync
        const { version } = JSON.parse(fs.readFileSync(file, 'utf8'));

        const m = version.match(
          /^([0-9]+)\.([0-9]+)\.([0-9]+)(-beta.[0-9]+)?$/
        );

        refute.isNull(m);
        const parts = eslint_version.split('.');
        for (let i = 0; i < parts.length; i++) {
          assert.equals(m[i + 1], parts[i]);
        }
      });

      describe('exit code', () => {

        if (semver.gte(semver.coerce(eslint_version), '6.0.0')) {
          it('fails when linting nonexistent file and sets exit code to 2',
            async () => {
              await linter.invoke(dir, ['bad-filename'], '', 'a', callback);

              assert.calledOnceWith(callback, match({
                exitCode: 2
              }));
            });
        } else {
          it('fails when using unspported option and sets exit code to 2',
            async () => {
              await linter.invoke(dir, [
                '--resolve-plugins-relative-to', plugin_folder,
                '-c', plugin_eslintrc,
                fixture_es6, '-f', 'unix'
              ], '', 'a', callback);

              assert.calledOnceWith(callback, match({
                exitCode: 2
              }));
            });
        }

      });


      describe('single file', () => {

        it('succeeds on lib/linter.js', async () => {
          await linter.invoke(dir, [lib_linter], '', 'a', callback);

          assert.calledOnceWith(callback, null, '');
        });

        it('fails on test/fixture/fail.txt', async () => {
          await linter.invoke(dir, [fixture_fail, '-f', 'unix'], '', 'a',
            callback);

          assert.calledWithMatch(callback, '/fail.txt:3:13:');
          assert.calledWithMatch(callback,
            'Strings must use singlequote. [Error/quotes]');
        });

      });

      describe('--stdin', () => {

        it('runs on --stdin text', async () => {
          await linter.invoke(dir, ['--stdin', '-f', 'unix'],
            'console.log();', 'a', callback);

          assert.calledWithMatch(callback, '<text>:1:1: Use the global '
            + 'form of \'use strict\'. [Error/strict]');
        });

      });

      describe('--fix-to-stdout', () => {

        it('returns fixed script', async () => {
          await linter.invoke(dir, ['--stdin', '--fix-to-stdout'],
            'console.log( "!" )\n', 'a', callback);

          assert.calledOnceWith(callback, null, 'console.log(\'!\');\n');
        });

        it('returns fixed script also with --quiet', async () => {
          await linter.invoke(dir, ['--stdin', '--fix-to-stdout', '--quiet'],
            'console.log( "!" )\n', 'a', callback);

          assert.calledOnceWith(callback, null, 'console.log(\'!\');\n');
        });

        it('fails if --stdin is not given', async () => {
          await linter.invoke(dir, ['--fix-to-stdout', '.'], '', 'a', callback);

          assert.calledOnceWith(callback,
            'The --fix-to-stdout option must be used with --stdin.');
        });

        it('returns input if nothing to fix', async () => {
          await linter.invoke(dir, ['--stdin', '--fix-to-stdout'],
            'console.log(\'!\');\n', 'a', callback);

          assert.calledOnceWith(callback, null, 'console.log(\'!\');\n');
        });

        describe('--fix-dry-run', () => {
          before(function () {
            if (semver.lte(semver.coerce(eslint_version), '4.9.0')) {
              this.skip();
            }
          });

          it('does not fail and does not return fixed script', async () => {
            await linter.invoke(dir,
              ['--fix-dry-run', '--stdin', '--fix-to-stdout'],
              'console.log( "!" )\n', 'a', callback);

            assert.calledOnceWith(callback, null, 'console.log( "!" )\n');
          });

        });
      });

      describe('--print-config', () => {

        it('fails with --stdin', async () => {
          await linter.invoke(dir, ['--stdin', '--print-config'],
            'console.log( "!" )\n', 'a', callback);

          const expected = semver.gte(semver.coerce(eslint_version), '7.0.0')
            ? 'The --print-config option must be used with exactly one '
              + 'file name.'
            : 'The --print-config option requires a single file as '
              + 'positional argument.';

          assert.calledOnceWith(callback, expected);
        });

        it('fails with --stdin and positional argument', async () => {
          await linter.invoke(dir, ['--stdin', '--print-config', '.'],
            'console.log( "!" )\n', 'a', callback);

          assert.calledOnceWith(callback, 'The --print-config option is '
            + 'not available for piped-in code.');
        });

        it('does not fail with --print-config and a filename', async () => {
          const args = ['--print-config', fixture_warn];

          await linter.invoke(dir, args, '', 'a', callback);

          assert.matchJson(callback.firstCall.args[1], {
            rules: match.defined
          });
        });

      });

      describe('--config', () => {

        it('lints file based on rules in specified config file', async () => {
          await linter.invoke(dir, [fixture_fail, '-f', 'unix',
            '--config', no_semi_eslintrc], '', 'a',
          callback);

          assert.calledWithMatch(callback, '/fail.txt:3:13:');
          assert.calledWithMatch(callback,
            'Extra semicolon. [Error/semi]');
        });

      });

      describe('--quiet', () => {

        it('prints warnings by default', async () => {
          await linter.invoke(dir, [fixture_warn, '-f', 'unix'], '', 'a',
            callback);

          assert.calledOnceWith(callback, null, match('Warning'));
        });

        it('does not print warnings', async () => {
          await linter.invoke(dir, ['--quiet', fixture_warn], '', 'a',
            callback);

          assert.calledOnceWith(callback, null, '');
        });

      });

      describe('--max-warnings', () => {

        it('returns output as error on failure', async () => {
          await linter.invoke(dir,
            [fixture_warn, '--max-warnings', '0'], '', 'a', callback);

          assert.calledOnceWith(callback, match.string);
        });

        it('does not return output as error if not exceeded', async () => {
          await linter.invoke(dir, [fixture_warn, '--max-warnings', '1'], '',
            'a', callback);

          assert.calledOnceWith(callback, null, match.string);
        });

      });

      describe('--color', () => {

        it('enables color by default', async () => {
          await linter.invoke(dir, ['--stdin'], '\'use strict\';', 'a',
            () => {});

          assert.isTrue(
            linter.cache.get(dir).chalk.enabled
            && linter.cache.get(dir).chalk.level !== 0);
        });

        it('disables color if --no-color is passed', async () => {
          await linter.invoke(dir, ['--stdin', '--no-color'],
            '\'use strict\';', 'a', () => {});

          assert.isFalse(
            linter.cache.get(dir).chalk.enabled
            && linter.cache.get(dir).chalk.level !== 0);
        });

      });

      describe('--parser-options', () => {
        before(function () {
          if (semver.gte(semver.coerce(eslint_version), '7.0.0')) {
            this.skip();
          }
        });

        it('fails with parse error on test/fixture/es6.txt', async () => {
          await linter.invoke(dir, [
            '--parser-options=ecmaVersion:5', fixture_es6, '-f', 'unix'
          ], '', 'a', callback);

          assert.calledOnce(callback);
          const out = callback.firstCall.args[0];
          const space = out.indexOf(' ');
          const slash = out.lastIndexOf('/', space);
          const newline = out.indexOf('\n');

          assert.equals(out.substring(slash, space), '/es6.txt:3:1:');
          assert.equals(out.substring(space + 1, newline),
            'Parsing error: The keyword \'const\' is reserved [Error]');
        });

        it('pass on test/fixture/es6.txt', async () => {
          linter.invoke(dir, [
            '--parser-options=ecmaVersion:6', fixture_es6, '-f', 'unix'
          ], '', 'a', callback);

          assert.calledOnceWith(callback, null, '');
        });

      });

      describe('--resolve-plugins-relative-to', () => {

        if (semver.lt(semver.coerce(eslint_version), '7.0.0')) {
          it('fail because ESLint can not find plugin', async () => {
            await linter.invoke(dir, [
              '-c', plugin_eslintrc,
              fixture_es6, '-f', 'unix'
            ], '', 'a', callback);

            assert.calledOnceWith(callback, match({
              message: match('Failed to load plugin'),
              messageTemplate: 'plugin-missing'
            }));
          });
        }

        if (semver.gte(semver.coerce(eslint_version), '6.0.0')) {
          it('pass well with plugin', async () => {
            await linter.invoke(dir, [
              '--resolve-plugins-relative-to', plugin_folder,
              '-c', plugin_eslintrc,
              fixture_es6, '-f', 'unix'
            ], '', 'a', callback);

            assert.calledOnceWith(callback, null, '');
          });
        } else {
          it('fail because option is not supported yet', async () => {
            await linter.invoke(dir, [
              '--resolve-plugins-relative-to', plugin_folder,
              '-c', plugin_eslintrc,
              fixture_es6, '-f', 'unix'
            ], '', 'a', callback);

            assert.calledOnceWith(callback, match({
              message: match('Failed to load plugin'),
              messageTemplate: 'plugin-missing'
            }));
          });
        }

      });

      describe('--report-unused-disable-directives', () => {

        if (semver.gte(semver.coerce(eslint_version), '4.8.0')) {
          it('fail on useless eslint-disable', async () => {
            await linter.invoke(dir, [
              '--report-unused-disable-directives',
              fixture_es6, '-f', 'unix'
            ], '', 'a', callback);

            assert.calledOnceWithMatch(callback, '/es6.txt:10:1:');
            assert.calledOnceWithMatch(callback, 'Unused eslint-disable '
              + 'directive (no problems were reported from \'no-alert\'). '
              + '[Error]');
          });
        } else {
          it('find nothing, because option is not supported yet', async () => {
            await linter.invoke(dir, [
              '--report-unused-disable-directives',
              fixture_es6, '-f', 'unix'
            ], '', 'a', callback);

            assert.calledOnceWith(callback, null, '');
          });
        }

        describe('--eslint-path', () => {

          it('uses the passed in binary', async () => {
            await linter.invoke(dir, [
              '--eslint-path', './node_modules/eslint',
              fixture_es6, '-f', 'unix'
            ], '', 'a', callback);

            assert.calledOnceWith(callback, null, '');
          });

          it('uses the passed in binary with quotes', async () => {
            await linter.invoke(dir, [
              '--eslint-path="./node_modules/eslint"',
              fixture_es6, '-f', 'unix'
            ], '', 'a', callback);

            assert.calledOnceWith(callback, null, '');
          });

        });
      });

    });

  }

  withinDirectory('8.0', 'test/fixture/v8.0.x');
  withinDirectory('7', cwd);
  withinDirectory('7.0', path.resolve('test/fixture/v7.0.x'));
  withinDirectory('6.8', 'test/fixture/v6.8.x');
  withinDirectory('6.0', 'test/fixture/v6.0.x');
  withinDirectory('5.16', 'test/fixture/v5.16.x');
  withinDirectory('5.0', 'test/fixture/v5.0.x');
  withinDirectory('4.19', 'test/fixture/v4.19.x');
  withinDirectory('4.0', 'test/fixture/v4.0.x');

  it('lets eslint handle unknown formatter', async () => {
    const callback = sinon.fake();

    await linter.invoke(cwd, ['test/fixture/fail.txt', '-f', 'unknown'], '',
      'a', callback);

    assert.calledOnceWithMatch(callback,
      'There was a problem loading formatter:');
    assert.calledOnceWithMatch(callback, 'formatters/unknown');
  });

});
