'use strict';

var eslint = require('eslint');
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

module.exports = function (cwd, args) {
  process.chdir(cwd);
  var currentOptions = options.parse([0, 0].concat(args));
  var files = currentOptions._;
  if (!files.length) {
    return options.generateHelp() + '\n';
  }
  var engine = new eslint.CLIEngine(translateOptions(currentOptions));
  var report = engine.executeOnFiles(files);
  if (currentOptions.quiet) {
    report.results = eslint.CLIEngine.getErrorResults(report.results);
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
