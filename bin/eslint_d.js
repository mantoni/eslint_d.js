#!/usr/bin/env node

import { loadConfig } from '../lib/config.js';
import { createResolver } from '../lib/resolver.js';
import { forwardToDaemon } from '../lib/forwarder.js';
import { launchDaemon, stopDaemon } from '../lib/launcher.js';
import { filesHash } from '../lib/hash.js';

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
      if (config) {
        console.log('eslint_d: Already running');
      } else {
        await launchDaemon(resolver, hash);
      }
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
      await launchDaemon(resolver, hash);
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
        config = await launchDaemon(resolver, hash);
        if (!config) {
          return;
        }
      }
      await forwardToDaemon(resolver, config);
  }
})();
