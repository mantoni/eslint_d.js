import { normalize } from 'node:path';
import fs from 'node:fs/promises';
import { assert, refute, sinon } from '@sinonjs/referee-sinon';
import { environmentHash, filesHash } from './hash.js';

describe('lib/hash', () => {
  context('environmentHash', () => {
    it('uses the inherited environment by default', () => {
      assert.equals(environmentHash(), environmentHash({ ...process.env }));
    });

    it('ignores the order of environment variables', () => {
      assert.equals(
        environmentHash({ FIRST: 'one', SECOND: 'two' }),
        environmentHash({ SECOND: 'two', FIRST: 'one' })
      );
    });

    it('separates arbitrary environment values', () => {
      refute.equals(
        environmentHash({ CUSTOM_RULE: 'enabled' }),
        environmentHash({ CUSTOM_RULE: 'disabled' })
      );
    });

    it('distinguishes absent variables from empty values', () => {
      refute.equals(environmentHash({}), environmentHash({ CUSTOM_RULE: '' }));
    });

    it('treats undefined values as absent', () => {
      assert.equals(
        environmentHash({}),
        environmentHash({ CUSTOM_RULE: undefined })
      );
    });

    it('ignores DEBUG because each request forwards it', () => {
      assert.equals(
        environmentHash({}),
        environmentHash({ DEBUG: 'eslint_d:*' })
      );
    });
  });

  context('filesHash', () => {
    const base = 'some/dir/node_modules/eslint';
    const cwd = process.cwd();

    it('reads files from cwd', () => {
      sinon.replace(fs, 'readFile', sinon.fake.returns(sinon.promise()));

      filesHash(base);

      assert.callCount(fs.readFile, 5);
      assert.calledWith(fs.readFile, normalize(`${cwd}/some/dir/package.json`));
      assert.calledWith(
        fs.readFile,
        normalize(`${cwd}/some/dir/package-lock.json`)
      );
      assert.calledWith(
        fs.readFile,
        normalize(`${cwd}/some/dir/npm-shrinkwrap.json`)
      );
      assert.calledWith(fs.readFile, normalize(`${cwd}/some/dir/yarn.lock`));
      assert.calledWith(
        fs.readFile,
        normalize(`${cwd}/some/dir/pnpm-lock.yaml`)
      );
    });

    it('resolves with hash of all files', async () => {
      sinon.replace(fs, 'readFile', sinon.fake.resolves('file content'));

      const promise = filesHash(base);

      await assert.resolves(promise, 'Jd1/4sH1IanXsNIo1eM+Jw==');
    });

    it('resolves with null hash if none of the files can be resolved', async () => {
      sinon.replace(fs, 'readFile', sinon.fake.rejects());

      const promise = filesHash(base);

      await assert.resolves(promise, '1B2M2Y8AsgTpgAmY7PhCfg==');
    });
  });
});
