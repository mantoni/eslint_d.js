'use strict';

var path = require('path');
var resolve = require('resolve');
var options = require('./options');

function translateOptions(cliOptions) {
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
    fix: cliOptions.fix
  };
}

var eslintMap = {};

module.exports = function (cwd, args, text) {
  process.chdir(cwd);
  var currentOptions = options.parse([0, 0].concat(args));
  var cwdEslint = eslintMap[cwd];
  if (!cwdEslint) {
    try {
      var filename = currentOptions.stdinFilename;
      var basedir = filename ? path.join(cwd, path.dirname(filename)) : cwd;
      cwdEslint = require(resolve.sync('eslint', { basedir: basedir }));
    } catch (e) {
      // module not found
      cwdEslint = require('eslint');
    }
    eslintMap[cwd] = cwdEslint;
  }
  var files = currentOptions._;
  var stdin = currentOptions.stdin;
  if (!files.length && (!stdin || !text)) {
    return options.generateHelp() + '\n';
  }
  var engine = new cwdEslint.CLIEngine(translateOptions(currentOptions));
  var report;
  if (stdin && text) {
    report = engine.executeOnText(text, currentOptions.stdinFilename);
  } else {
    report = engine.executeOnFiles(files);
  }
  if (currentOptions.quiet) {
    report.results = cwdEslint.CLIEngine.getErrorResults(report.results);
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
  return output;
};
