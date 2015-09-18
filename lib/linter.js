'use strict';

var eslint = require('eslint');

var engines = {};

function getEngine(cwd) {
  var engine = engines[cwd];
  if (!engine) {
    engine = new eslint.CLIEngine();
    engines[cwd] = engine;
  }
  return engine;
}

module.exports = function (cwd, files) {
  process.chdir(cwd);
  var engine = getEngine(cwd);
  var report = engine.executeOnFiles(files);
  var formatter = engine.getFormatter('compact');
  return formatter(report.results);
};
