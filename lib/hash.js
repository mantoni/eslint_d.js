import fs from 'node:fs/promises';
import path from 'path';
import crypto from 'crypto';

const files = [
  'package.json',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

/**
 * @param {typeof process.env} [env]
 * @returns {string}
 */
export function environmentHash(env = process.env) {
  // DEBUG is forwarded for each request. Other variables can affect cached config.
  const entries = Object.keys(env)
    .sort()
    .filter((name) => name !== 'DEBUG' && env[name] !== undefined)
    .map((name) => [name, env[name]]);
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(entries))
    .digest('hex');
}

/**
 * @param {string} base
 * @returns {Promise<string>}
 */
export async function filesHash(base) {
  const project = path.resolve(base, '../..');
  const results = await Promise.allSettled(
    files.map((file) => fs.readFile(path.join(project, file)))
  );
  const hash = crypto.createHash('md5');
  for (const result of results) {
    if (result.status === 'fulfilled') {
      hash.update(result.value);
    }
  }
  return hash.digest('base64');
}
