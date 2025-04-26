import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import child_process from 'node:child_process';
import debug from 'debug';
import { configFile, loadConfig, removeConfig } from './config.js';
import { forwardCommandToDaemon } from './forwarder.js';
import { SHUTDOWN_COMMAND } from './commands.js';

/**
 * @import { Config } from './config.js'
 * @import { Resolver } from './resolver.js'
 */

const log = debug('eslint_d:launcher');

/**
 * @param {Resolver} resolver
 * @param {string} hash
 * @param {boolean} is_debug_mode
 * @returns {Promise<Config | null>}
 */
export async function launchDaemon(resolver, hash, is_debug_mode) {
  let config = null;
  let error;
  try {
    const ppid = getPPID();
    const idle = getIDLE(ppid);
    const base = resolver.base;

    const daemon = resolver.require.resolve('./daemon.js');

    log('Launching daemon %o', { daemon, ppid, idle, base, hash });
    const daemon_process = child_process.spawn(
      process.argv0,
      [daemon, ppid, idle, base, hash],
      {
        detached: !is_debug_mode,
        stdio: is_debug_mode ? 'inherit' : 'ignore',
        env: Object.assign({}, process.env, {
          DEBUG: is_debug_mode ? process.env.DEBUG : '',
          DEBUG_COLORS: 1
        })
      }
    );
    if (is_debug_mode) {
      process.on('SIGINT', () => {
        log('Process SIGINT');
        removeConfig(resolver);
      });
    } else {
      daemon_process.unref();
    }

    await waitForConfig(configFile(resolver));
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
  log('Stopping daemon %o', config);
  try {
    await Promise.all([
      waitForConfig(configFile(resolver)),
      platformAwareStopDaemon(config)
    ]);
  } catch (err) {
    console.error(`eslint_d: ${err} - removing config`);
    await removeConfig(resolver);
  }
}

/**
 * @param {Config} config
 * @returns {Promise<void>}
 */
function platformAwareStopDaemon(config) {
  if (os.platform() === 'win32') {
    return forwardCommandToDaemon(config, SHUTDOWN_COMMAND);
  }

  process.kill(config.pid, 'SIGTERM');
  return Promise.resolve();
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
 * @param {string} resolverConfigFile
 * @returns {Promise<void>}
 */
function waitForConfig(resolverConfigFile) {
  return new Promise((resolve, reject) => {
    const configBasename = path.basename(resolverConfigFile);
    let timeout = null;
    const watcher = fs
      .watch(path.dirname(resolverConfigFile))
      .on('change', (type, filename) => {
        if (type === 'rename' && filename === configBasename) {
          clearTimeout(timeout);
          watcher.close();
          resolve();
        }
      })
      .on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    timeout = setTimeout(() => {
      watcher.close();
      timeout = null;
      reject(new Error('Timed out waiting for config'));
    }, 2000);
  });
}
