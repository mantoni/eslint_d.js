'use strict';

var eslint = require('eslint');

module.exports = function (cwd, files) {
  process.chdir(cwd);
  var engine = new eslint.CLIEngine();
  var report = engine.executeOnFiles(files);
  var formatter = engine.getFormatter('compact');
  return formatter(report.results);
};
