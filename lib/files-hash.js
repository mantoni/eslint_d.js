'use strict';

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

exports.filesHash = filesHash;

async function filesHash(cwd, files) {
  const { existing, hash } = await getHash(
    files.map((file) => path.join(cwd, file))
  );
  if (existing.length === 0) {
    return null;
  }

  let last_hash = hash;
  return async () => {
    const { hash } = await getHash(existing);
    if (last_hash === hash) {
      return false;
    }
    last_hash = hash;
    return true;
  };
}

async function getHash(files) {
  const results = await Promise.allSettled(
    files.map((file) => fs.readFile(file))
  );
  const existing = [];
  const hash = crypto.createHash('md5');
  for (let i = 0; i < results.length; i++) {
    const { status, value } = results[i];
    if (status === 'fulfilled') {
      existing.push(files[i]);
      hash.update(value);
    }
  }
  return { existing, hash: hash.digest('base64') };
}
