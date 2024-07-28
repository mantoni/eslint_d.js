import fs from 'node:fs/promises';
import { assert, sinon } from '@sinonjs/referee-sinon';
import { filesHash } from './hash.js';

describe('lib/hash', () => {
  context('filesHash', () => {
    it('reads files from cwd', () => {
      sinon.replace(process, 'cwd', sinon.fake.returns('some/dir'));
      sinon.replace(fs, 'readFile', sinon.fake.returns(sinon.promise()));

      filesHash();

      assert.callCount(fs.readFile, 5);
      assert.calledWith(fs.readFile, 'some/dir/package.json');
      assert.calledWith(fs.readFile, 'some/dir/package-lock.json');
      assert.calledWith(fs.readFile, 'some/dir/npm-shrinkwrap.json');
      assert.calledWith(fs.readFile, 'some/dir/yarn.lock');
      assert.calledWith(fs.readFile, 'some/dir/pnpm-lock.yaml');
    });

    it('resolves with hash of all files', async () => {
      sinon.replace(fs, 'readFile', sinon.fake.resolves('file content'));

      const promise = filesHash();

      await assert.resolves(promise, 'Jd1/4sH1IanXsNIo1eM+Jw==');
    });

    it('resolves with null hash if none of the files can be resolved', async () => {
      sinon.replace(fs, 'readFile', sinon.fake.rejects());

      const promise = filesHash();

      await assert.resolves(promise, '1B2M2Y8AsgTpgAmY7PhCfg==');
    });
  });
});
