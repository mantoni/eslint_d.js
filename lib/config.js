import fs from 'node:fs/promises';

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
  try {
    const raw = await fs.readFile(configFile(resolver), 'utf8');
    const [token, port, pid, hash] = raw.split(' ');
    return { token, port: Number(port), pid: Number(pid), hash };
  } catch {
    return null;
  }
}

/**
 * @param {Resolver} resolver
 * @param {Config} config
 */
export async function writeConfig(resolver, config) {
  const { token, port, pid, hash } = config;
  await fs.writeFile(configFile(resolver), `${token} ${port} ${pid} ${hash}`);
}

/**
 * @param {Resolver} resolver
 */
export async function removeConfig(resolver) {
  try {
    await fs.unlink(configFile(resolver));
  } catch {
    // ignore
  }
}

/**
 * @param {Resolver} resolver
 * @returns {string}
 */
export function configFile(resolver) {
  return `${resolver.base}/.eslint_d`;
}
