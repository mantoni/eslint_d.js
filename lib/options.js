'use strict';

var optionator = require('optionator');

module.exports = optionator({
  prepend: 'eslint_d [options] file.js [file.js] [dir]',
  defaults: {
    concatRepeatedArrays: true,
    mergeRepeatedObjects: true
  },
  options: [
    {
      heading: 'Basic configuration'
    },
    {
      option: 'config',
      alias: 'c',
      type: 'path::String',
      description: 'Use configuration from this file or shareable config'
    },
    {
      option: 'eslintrc',
      type: 'Boolean',
      default: 'true',
      description: 'Disable use of configuration from .eslintrc'
    },
    {
      option: 'env',
      type: '[String]',
      description: 'Specify environments'
    },
    {
      option: 'ext',
      type: '[String]',
      default: '.js',
      description: 'Specify JavaScript file extensions'
    },
    {
      option: 'global',
      type: '[String]',
      description: 'Define global variables'
    },
    {
      option: 'parser',
      type: 'String',
      default: 'espree',
      description: 'Specify the parser to be used'
    },
    {
      heading: 'Caching'
    },
    {
      option: 'cache',
      type: 'Boolean',
      default: 'false',
      description: 'Only check changed files'
    },
    {
      option: 'cache-file',
      type: 'String',
      default: '.eslintcache',
      description: 'Path to the cache file'
    },
    {
      option: 'cache-location',
      type: 'path::String',
      description: 'Path to the cache file or directory'
    },
    {
      heading: 'Specifying rules and plugins'
    },
    {
      option: 'rulesdir',
      type: '[path::String]',
      description: 'Use additional rules from this directory'
    },
    {
      option: 'plugin',
      type: '[String]',
      description: 'Specify plugins'
    },
    {
      option: 'rule',
      type: 'Object',
      description: 'Specify rules'
    },
    {
      heading: 'Ignoring files'
    },
    {
      option: 'ignore-path',
      type: 'path::String',
      description: 'Specify path of ignore file'
    },
    {
      option: 'ignore',
      type: 'Boolean',
      default: 'true',
      description: 'Disable use of .eslintignore'
    },
    {
      option: 'ignore-pattern',
      type: 'String',
      description:
        'Pattern of files to ignore (in addition to those in .eslintignore)'
    },
    {
      heading: 'Using stdin'
    },
    {
      option: 'stdin',
      type: 'Boolean',
      default: 'false',
      description: 'Lint code provided on <STDIN>'
    },
    {
      option: 'stdin-filename',
      type: 'String',
      description: 'Specify filename to process STDIN as'
    },
    {
      heading: 'Handling warnings'
    },
    {
      option: 'quiet',
      type: 'Boolean',
      default: 'false',
      description: 'Report errors only'
    },
    {
      option: 'max-warnings',
      type: 'Number',
      default: '-1',
      description: 'Number of warnings to trigger nonzero exit code'
    },
    {
      heading: 'Output'
    },
    {
      option: 'format',
      alias: 'f',
      type: 'String',
      default: 'stylish',
      description: 'Use a specific output format'
    },
    {
      option: 'color',
      type: 'Boolean',
      default: 'true',
      description: 'Disable color in piped output'
    },
    {
      heading: 'Miscellaneous'
    },
    {
      option: 'fix',
      type: 'Boolean',
      default: false,
      description: 'Automatically fix problems'
    },
    {
      option: 'debug',
      type: 'Boolean',
      default: false,
      description: 'Output debugging information'
    },
    {
      option: 'help',
      alias: 'h',
      type: 'Boolean',
      description: 'Show help'
    },
    {
      option: 'version',
      alias: 'v',
      type: 'Boolean',
      description: 'Outputs the eslint and eslint_d version numbers'
    },
    {
      option: 'inline-config',
      type: 'Boolean',
      default: 'true',
      description: 'Allow comments to change eslint config/rules'
    }
  ]
});
