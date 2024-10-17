#!/usr/bin/env node

import debug from 'debug';
import { loadConfig, removeConfig } from '../lib/config.js';
import { createResolver } from '../lib/resolver.js';
import { forwardToDaemon, isAlive } from '../lib/forwarder.js';
import { launchDaemon, stopDaemon } from '../lib/launcher.js';
import { filesHash } from '../lib/hash.js';

const is_debug_mode = process.argv.includes('--debug');
if (is_debug_mode) {
  debug.enable(
    process.env.DEBUG || 'eslint_d:*,eslint:*,-eslint:code-path,eslintrc:*'
  );
}

const command = process.argv[2];

(async () => {
  if (command === '--help' || command === '-h') {
    (await import('../lib/help.js')).help();
    return;
  }
  if (command === '--version' || command === '-v') {
    (await import('../lib/version.js')).version();
    return;
  }

  const resolver = await createResolver();
  if (resolver === 'ignore' || resolver === 'fail') {
    (await import('../lib/miss.js')).miss(resolver, command);
    return;
  }

  // eslint-disable-next-line prefer-const
  let [config, hash] = await Promise.all([
    loadConfig(resolver),
    filesHash(resolver.base)
  ]);
  switch (command) {
    case 'start':
      if (await isAlive(config)) {
        console.log('eslint_d: Already running');
        return;
      }

      if (config) {
        await removeConfig(resolver);
      }

      await launchDaemon(resolver, hash, is_debug_mode);

      return;
    case 'stop':
      if (config) {
        await stopDaemon(resolver, config);
      } else {
        console.log('eslint_d: Already stopped');
      }
      return;
    case 'restart':
      if (config) {
        await stopDaemon(resolver, config);
      }
      await launchDaemon(resolver, hash, is_debug_mode);
      return;
    case 'status':
      (await import('../lib/status.js')).status(resolver, config);
      return;
    default:
      if (config && config.hash !== hash) {
        await stopDaemon(resolver, config);
        config = null;
      }
      if (!config) {
        config = await launchDaemon(resolver, hash, false);
        if (!config) {
          return;
        }
      }
      await forwardToDaemon(resolver, config);
  }
})();
