import fs from 'node:fs';
import child_process from 'node:child_process';
import { loadConfig, removeConfig } from './config.js';

/**
 * @import { Config } from './config.js'
 * @import { Resolver } from './resolver.js'
 */

/**
 * @param {Resolver} resolver
 * @param {string} hash
 * @returns {Promise<Config | null>}
 */
export async function launchDaemon(resolver, hash) {
  let config = null;
  let error;
  try {
    const ppid = getPPID();
    const idle = getIDLE(ppid);

    const daemon = resolver.require.resolve('./daemon.js');
    child_process
      .spawn(process.argv0, [daemon, ppid, idle, resolver.base, hash], {
        detached: true,
        stdio: 'ignore'
      })
      .unref();

    await waitForConfig(resolver.base);
    config = await loadConfig(resolver);
  } catch (err) {
    error = err;
  }
  if (!config) {
    console.error(`eslint_d: Failed to start daemon – ${error || 'No config'}`);
    // eslint-disable-next-line require-atomic-updates
    process.exitCode = 1;
  }
  return config;
}

/**
 * @param {Resolver} resolver
 * @param {Config} config
 */
export async function stopDaemon(resolver, config) {
  try {
    process.kill(config.pid, 'SIGTERM');
  } catch (err) {
    console.error(`eslint_d: ${err} - removing config`);
    await removeConfig(resolver);
    return;
  }
  await waitForConfig(resolver.base);
}

/**
 * @returns {string}
 */
function getPPID() {
  const env = process.env.ESLINT_D_PPID;
  if (!env) {
    return '0';
  }
  if (env === 'auto') {
    return String(process.ppid);
  }
  if (String(Number(env)) !== env) {
    throw new Error('ESLINT_D_PPID must be a number or "auto"');
  }
  return env;
}

/**
 * @param {string} ppid
 * @returns {string}
 */
function getIDLE(ppid) {
  const idle = process.env.ESLINT_D_IDLE;
  if (!idle) {
    return Number(ppid) ? '0' : '15';
  }
  if (String(Number(idle)) !== idle) {
    throw new Error('ESLINT_D_IDLE must be a number');
  }
  return idle;
}

/**
 * @param {string} base
 * @returns {Promise<void>}
 */
function waitForConfig(base) {
  return new Promise((resolve, reject) => {
    const watcher = fs
      .watch(base)
      .on('change', (type, filename) => {
        if (type === 'rename' && filename === '.eslint_d') {
          watcher.close();
          resolve();
        }
      })
      .on('error', reject);
  });
}
