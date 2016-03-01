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
    fix: cliOptions.fix,
    allowInlineConfig: cliOptions.inlineConfig,
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
  var currentOptions = options.parse([0, 0].concat(args));
  cwdDeps.chalk.enabled = currentOptions.color;
  var files = currentOptions._;
  var stdin = currentOptions.stdin;
  if (!files.length && (!stdin || !text)) {
    return options.generateHelp() + '\n';
  }
  var engine = new cwdDeps.eslint.CLIEngine(
    translateOptions(currentOptions, cwd)
  );
  var report;
  if (stdin && text) {
    report = engine.executeOnText(text, currentOptions.stdinFilename);
  } else {
    report = engine.executeOnFiles(files);
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
    return [output, 1];
  } else {
    return [output, 0];
  }
};
