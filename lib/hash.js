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
 * @returns {Promise<string>}
 */
export async function filesHash() {
  const cwd = process.cwd();
  const results = await Promise.allSettled(
    files.map((file) => fs.readFile(path.join(cwd, file)))
  );
  const hash = crypto.createHash('md5');
  for (const result of results) {
    if (result.status === 'fulfilled') {
      hash.update(result.value);
    }
  }
  return hash.digest('base64');
}
