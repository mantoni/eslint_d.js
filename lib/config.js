import debug from 'debug';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const log = debug('eslint_d:config');

/**
 * @import { Resolver} from './resolver.js'
 */

/**
 * @typedef {Object} Config
 * @property {string} token
 * @property {number} port
 * @property {number} pid
 * @property {string} hash
 */

/**
 * @param {Resolver} resolver
 * @returns {Promise<Config | null>}
 */
export async function loadConfig(resolver) {
  const filename = configFile(resolver);
  log('Reading config from %s', filename);

  try {
    let raw = await fs.readFile(filename, 'utf8');
    if (!raw) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      raw = await fs.readFile(filename, 'utf8');
    }
    const [token, port, pid, hash] = raw.split(' ');
    return { token, port: Number(port), pid: Number(pid), hash };
  } catch {
    log('Config not found');
    return null;
  }
}

/**
 * @param {Resolver} resolver
 * @param {Config} config
 */
export async function writeConfig(resolver, config) {
  const filename = configFile(resolver);
  log('Writing config to %s', filename);

  const { token, port, pid, hash } = config;
  await fs.writeFile(filename, `${token} ${port} ${pid} ${hash}`);
}

/**
 * @param {Resolver} resolver
 */
export async function removeConfig(resolver) {
  const filename = configFile(resolver);
  log('Removing config at %s', filename);
  try {
    await fs.unlink(filename);
  } catch {
    // ignore
  }
}

/**
 * @param {Resolver} resolver
 * @returns {string}
 */
export function configFile(resolver) {
  const hash = createHash('sha256');

  hash.update(`${resolver.base}/.eslint_d`);

  return path.join(os.tmpdir(), `.${hash.digest('hex')}.eslint_d`);
}
