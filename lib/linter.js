/* eslint-disable no-sync */
'use strict';

const fs = require('fs');
const path = require('path');
const LRU = require('nanolru');
const resolver = require('./resolver');
const eslint_path = require('./eslint-path');
const options_cliengine = require('./options-cliengine');
const options_eslint = require('./options-eslint');

function translateOptionsCLIEngine(cliOptions, cwd) {
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
    fix: cliOptions.fixDryRun
      ? false : (cliOptions.fix || cliOptions.fixToStdout),
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

function translateOptionsESLint(cliOptions, cwd) {
  return {
    allowInlineConfig: cliOptions.inlineConfig,
    cache: cliOptions.cache,
    cacheLocation: cliOptions.cacheLocation || cliOptions.cacheFile,
    errorOnUnmatchedPattern: cliOptions.errorOnUnmatchedPattern,
    extensions: cliOptions.ext,
    fix: cliOptions.fix || cliOptions.fixDryRun || cliOptions.fixToStdout,
    fixTypes: cliOptions.fixType,
    ignore: cliOptions.ignore,
    ignorePath: cliOptions.ignorePath,
    overrideConfig: {
      env: cliOptions.env && cliOptions.env.reduce((obj, name) => {
        obj[name] = true;
        return obj;
      }, {}),
      globals: cliOptions.global && cliOptions.global.reduce((obj, name) => {
        if (name.endsWith(':true')) {
          obj[name.slice(0, -5)] = 'writable';
        } else {
          obj[name] = 'readonly';
        }
        return obj;
      }, {}),
      ignorePatterns: cliOptions.ignorePattern,
      parser: cliOptions.parser,
      parserOptions: cliOptions.parserOptions,
      plugins: cliOptions.plugin,
      rules: cliOptions.rule
    },
    overrideConfigFile: cliOptions.config,
    reportUnusedDisableDirectives: cliOptions.reportUnusedDisableDirectives
      ? 'error' : undefined,
    resolvePluginsRelativeTo: cliOptions.resolvePluginsRelativeTo,
    rulePaths: cliOptions.rulesdir,
    useEslintrc: cliOptions.eslintrc,
    cwd
  };
}

const eslintCache = new LRU(10);

function createCache(cwd) {
  const eslintPath = eslint_path.resolve(cwd);
  return eslintCache.set(cwd, {
    eslint: require(eslintPath),
    // use chalk from eslint
    chalk: require(resolver.resolve('chalk', {
      paths: [path.dirname(eslintPath)]
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

function countErrors(results) {
  let errorCount = 0;
  let warningCount = 0;
  for (const result of results) {
    errorCount += result.errorCount;
    warningCount += result.warningCount;
  }
  return { errorCount, warningCount };
}

function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return false;
    }
    throw error;
  }
}

async function printResults(engine, results, opts, callback) {
  const { format, outputFile } = opts;
  let formatter;
  try {
    formatter = await engine.loadFormatter(format);
  } catch (e) {
    callback(e.message);
    return;
  }

  const output = formatter.format(results);
  if (output) {
    if (outputFile) {
      const filePath = path.resolve(process.cwd(), outputFile);

      if (isDirectory(filePath)) {
        callback(`Cannot write to output file path, it is a directory: ${
          outputFile}`);
        return;
      }

      try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, output);
      } catch (ex) {
        callback(`There was a problem writing the output file:\n${ex}`);
        return;
      }
    } else {
      const { errorCount, warningCount } = countErrors(results);
      const tooManyWarnings
        = opts.maxWarnings >= 0 && warningCount > opts.maxWarnings;

      if (!errorCount && tooManyWarnings) {
        callback(`${output}\nESLint found too many warnings (maximum: ${
          opts.maxWarnings}).`);
        return;
      }
      if (errorCount) {
        callback(output);
        return;
      }
    }
  }
  callback(null, output);
}

async function executeWithESLint(ESLint, cwd, opts, text, callback) {
  const engine = new ESLint(translateOptionsESLint(opts, cwd));
  const files = opts._;
  const stdin = opts.stdin;

  if (opts.printConfig) {
    if (files.length !== 1) {
      callback(
        'The --print-config option must be used with exactly one file name.'
      );
      return;
    }
    if (text) {
      callback('The --print-config option is not available for piped-in code.');
      return;
    }

    const fileConfig = await engine.calculateConfigForFile(files[0]);
    callback(null, JSON.stringify(fileConfig, null, '  '));
    return;
  }

  let results;
  if (stdin) {
    results = await engine.lintText(text, {
      filePath: opts.stdinFilename,
      warnIgnored: true
    });
  } else {
    results = await engine.lintFiles(files);
  }
  if (opts.fixToStdout) {
    // No results will be returned if the file is ignored
    // No output will be returned if there are no fixes
    callback(null,
      (!opts.fixDryRun && results[0] && results[0].output) || text);
    return;
  }
  if (opts.fix) {
    await ESLint.outputFixes(results);
  }
  if (opts.quiet) {
    results = ESLint.getErrorResults(results);
  }
  await printResults(engine, results, opts, callback);
}

function executeWithCLIEngine(CLIEngine, cwd, opts, text, callback) {
  const eslintOptions = translateOptionsCLIEngine(opts, cwd);
  // v4.0 API compatibility
  eslintOptions.cwd = path.resolve(cwd);
  const engine = new CLIEngine(eslintOptions);

  const files = opts._;
  const stdin = opts.stdin;
  if (opts.printConfig) {
    if (files.length !== 1) {
      callback('The --print-config option requires a single file as positional '
        + 'argument.');
      return;
    }
    if (text) {
      callback('The --print-config option is not available for piped-in code.');
      return;
    }

    const fileConfig = engine.getConfigForFile(files[0]);
    callback(null, JSON.stringify(fileConfig, null, '  '));
    return;
  }

  let report;
  if (stdin) {
    report = engine.executeOnText(text, opts.stdinFilename);
  } else {
    report = engine.executeOnFiles(files);
  }
  if (opts.fixToStdout) {
    // No results will be returned if the file is ignored
    // No output will be returned if there are no fixes
    callback(null, (report.results[0] && report.results[0].output) || text);
    return;
  }
  if (opts.fix) {
    CLIEngine.outputFixes(report);
  }
  if (opts.quiet) {
    report.results = CLIEngine.getErrorResults(report.results);
  }
  const format = opts.format;
  const formatter = engine.getFormatter(format);
  const output = formatter(report.results);
  const max_warnings = opts.maxWarnings;
  if (report.errorCount
      || (max_warnings >= 0 && report.warningCount > max_warnings)) {
    callback(output);
    return;
  }
  callback(null, output);
}

/*
 * The core_d service entry point.
 */
exports.invoke = async function (cwd, args, text, mtime, callback) {
  process.chdir(cwd);

  let cache = eslintCache.get(cwd);
  if (!cache) {
    cache = createCache(cwd);
  } else if (mtime > cache.last_run) {
    clearRequireCache(cwd);
    cache = createCache(cwd);
  }
  cache.last_run = Date.now();

  const options = cache.eslint.ESLint
    ? options_eslint
    : options_cliengine;
  const opts = options.parse([0, 0].concat(args));
  cache.chalk.enabled = opts.color;
  if (opts.color === false) {
    cache.chalk.level = 0;
  } else {
    cache.chalk.level = undefined;
  }
  const files = opts._;
  const stdin = opts.stdin;
  if (!files.length && (!stdin || typeof text !== 'string')) {
    callback(null, `${options.generateHelp()}\n`);
    return;
  }

  if (opts.fixToStdout && !stdin) {
    callback('The --fix-to-stdout option must be used with --stdin.');
    return;
  }

  if (cache.eslint.ESLint) {
    const absolute_cwd = path.resolve(cwd);
    try {
      await executeWithESLint(cache.eslint.ESLint, absolute_cwd, opts, text,
        callback);
    } catch (e) {
      e.exitCode = 2;
      callback(e);
    }
    return;
  }
  try {
    executeWithCLIEngine(cache.eslint.CLIEngine, cwd, opts, text, callback);
  } catch (e) {
    e.exitCode = 2;
    callback(e);
  }
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
