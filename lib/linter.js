'use strict';

var resolve = require('resolve');
var options = require('./options');
var path = require('path');

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
    cwd: cwd
  };
}

var eslintMap = {};

module.exports = function (cwd, args, text) {
  process.chdir(cwd);
  var cwdDeps = eslintMap[cwd];
  if (!cwdDeps) {
    var eslintPath;
    try {
      eslintPath = resolve.sync('eslint', { basedir: cwd });
    } catch (e) {
      // module not found
      eslintPath = resolve.sync('eslint');
    }
    cwdDeps = eslintMap[cwd] = {
      eslint: require(eslintPath),
      // use chalk from eslint
      chalk: require(resolve.sync('chalk', {
        basedir: path.dirname(eslintPath)
      }))
    };
  }
  var currentOptions;
  try {
    currentOptions = options.parse([0, 0].concat(args));
  } catch (e) {
    return e.message + '\n# exit 1';
  }
  cwdDeps.chalk.enabled = currentOptions.color;
  var files = currentOptions._;
  var stdin = currentOptions.stdin;
  if (!files.length && (!stdin || typeof text !== 'string')) {
    return options.generateHelp() + '\n';
  }
  var engine = new cwdDeps.eslint.CLIEngine(
    translateOptions(currentOptions, cwd)
  );
  if (currentOptions.printConfig) {
    if (files.length !== 1) {
      return 'The --print-config option requires a "'
        + 'single file as positional argument.\n# exit 1';
    }

    if (text) {
      return 'The --print-config option is not available for piped-in code.'
        + '\n# exit 1';
    }

    var fileConfig = engine.getConfigForFile(files[0]);

    return JSON.stringify(fileConfig, null, '  ');
  }
  if (currentOptions.fixToStdout && !stdin) {
    return 'The --fix-to-stdout option must be used with --stdin.'
      + '\n# exit 1';
  }
  var report;
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
    cwdDeps.eslint.CLIEngine.outputFixes(report);
  }
  if (currentOptions.quiet) {
    report.results = cwdDeps.eslint.CLIEngine.getErrorResults(report.results);
  }
  var format = currentOptions.format;
  var formatter = engine.getFormatter(format);
  if (!formatter) {
    return 'Could not find formatter \'' + format + '\'.\n';
  }
  var output = formatter(report.results);
  var tooManyWarnings = currentOptions.maxWarnings >= 0
    && report.warningCount > currentOptions.maxWarnings;
  if (!report.errorCount && tooManyWarnings) {
    output += 'ESLint found too many warnings (maximum: '
     + currentOptions.maxWarnings + ').\n';
  }
  if (report.errorCount) {
    output += '\n# exit 1';
  }
  return output;
};
