'use strict';

const LRU = require('nanolru');
const resolve = require('resolve');
const options = require('./options');
const path = require('path');

function translateOptions(cliOptions, cwd) {
  return {
    envs: cliOptions.env,
    extensions: cliOptions.ext,
    rules: cliOptions.rule,
    plugins: cliOptions.plugin,
    globals: cliOptions.global,
    ignore: cliOptions.ignore,
    ignorePath: cliOptions.ignorePath,
    ignorePattern: cliOptions.ignorePattern,
    configFile: cliOptions.config,
    rulePaths: cliOptions.rulesdir,
    useEslintrc: cliOptions.eslintrc,
    parser: cliOptions.parser,
    cache: cliOptions.cache,
    cacheFile: cliOptions.cacheFile,
    cacheLocation: cliOptions.cacheLocation,
    fix: cliOptions.fix || cliOptions.fixToStdout,
    allowInlineConfig: cliOptions.inlineConfig,
    printConfig: cliOptions.printConfig,
    parserOptions: cliOptions.parserOptions,
    resolvePluginsRelativeTo: cliOptions.resolvePluginsRelativeTo,
    fixDryRun: cliOptions.fixDryRun,
    fixType: cliOptions.fixType,
    reportUnusedDisableDirectives: cliOptions.reportUnusedDisableDirectives,
    init: cliOptions.init,
    envInfo: cliOptions.envInfo,
    errorOnUnmatchedPattern: cliOptions.errorOnUnmatchedPattern,
    cwd
  };
}

const eslintCache = new LRU(10);

function fail(message) {
  return `${message}\n# exit 1`;
}

function createCache(cwd) {
  let eslintPath;
  try {
    eslintPath = resolve.sync('eslint', { basedir: cwd });
  } catch (e) {
    // module not found
    eslintPath = resolve.sync('eslint');
  }
  return eslintCache.set(cwd, {
    eslint: require(eslintPath),
    // use chalk from eslint
    chalk: require(resolve.sync('chalk', {
      basedir: path.dirname(eslintPath)
    }))
  });
}

function clearRequireCache(cwd) {
  Object.keys(require.cache)
    .filter(key => key.startsWith(cwd))
    .forEach((key) => {
      delete require.cache[key];
    });
}

/*
 * The core_d service entry point.
 */
exports.invoke = function (cwd, args, text, mtime) {
  process.chdir(cwd);

  let cache = eslintCache.get(cwd);
  if (!cache) {
    cache = createCache(cwd);
  } else if (mtime > cache.last_run) {
    clearRequireCache(cwd);
    cache = createCache(cwd);
  }
  cache.last_run = Date.now();

  const currentOptions = options.parse([0, 0].concat(args));
  cache.chalk.enabled = currentOptions.color;
  const files = currentOptions._;
  const stdin = currentOptions.stdin;
  if (!files.length && (!stdin || typeof text !== 'string')) {
    return `${options.generateHelp()}\n`;
  }
  const eslintOptions = translateOptions(currentOptions, cwd);
  // v4.0 API compatibility
  eslintOptions.cwd = path.resolve(cwd);
  const engine = new cache.eslint.CLIEngine(eslintOptions);
  if (currentOptions.printConfig) {
    if (files.length !== 1) {
      return fail('The --print-config option requires a '
        + 'single file as positional argument.');
    }
    if (text) {
      return fail('The --print-config option is not available for piped-in '
        + 'code.');
    }

    const fileConfig = engine.getConfigForFile(files[0]);
    return JSON.stringify(fileConfig, null, '  ');
  }
  if (currentOptions.fixToStdout && !stdin) {
    return fail('The --fix-to-stdout option must be used with --stdin.');
  }
  let report;
  if (stdin) {
    report = engine.executeOnText(text, currentOptions.stdinFilename);
  } else {
    report = engine.executeOnFiles(files);
  }
  if (currentOptions.fixToStdout) {
    // No results will be returned if the file is ignored
    // No output will be returned if there are no fixes
    return (report.results[0] && report.results[0].output) || text;
  }
  if (currentOptions.fix) {
    cache.eslint.CLIEngine.outputFixes(report);
  }
  if (currentOptions.quiet) {
    report.results = cache.eslint.CLIEngine.getErrorResults(report.results);
  }
  const format = currentOptions.format;
  const formatter = engine.getFormatter(format);
  const output = formatter(report.results);
  const max_warnings = currentOptions.maxWarnings;
  if (report.errorCount
      || (max_warnings >= 0 && report.warningCount > max_warnings)) {
    return fail(output);
  }
  return output;
};

exports.cache = eslintCache;

/*
 * The core_d status hook.
 */
exports.getStatus = function () {
  const { keys } = eslintCache;
  if (keys.length === 0) {
    return 'No instances cached.';
  }
  if (keys.length === 1) {
    return 'One instance cached.';
  }
  return `${keys.length} instances cached.`;
};
