/*eslint-env mocha*/
'use strict';

const { assert, refute, sinon } = require('@sinonjs/referee-sinon');
const eslint_path = require('../lib/eslint-path');
const files_hash = require('../lib/files-hash');
const { getCache, lru_cache } = require('../lib/caches');

describe('test/caches', () => {
  const cwd = process.cwd();

  afterEach(() => {
    lru_cache.clear();
    sinon.restore();
  });

  it('calls eslint_path.resolve with cwd and eslint_path_arg', async () => {
    sinon.replace(eslint_path, 'resolve', sinon.fake.returns(null));

    await getCache(cwd, 'something');

    assert.calledOnceWith(eslint_path.resolve, cwd, 'something');
  });

  it('calls filesHash with cwd and common package manager files', async () => {
    sinon.replace(files_hash, 'filesHash', sinon.fake.resolves(() => {}));

    await getCache(cwd);

    assert.calledOnceWith(files_hash.filesHash, cwd, [
      'package.json',
      'package-lock.json',
      'npm-shrinkwrap.json',
      'yarn.lock',
      'pnpm-lock.yaml'
    ]);
  });

  it('creates a new cache with filesChanged', async () => {
    const filesChanged = sinon.fake();
    sinon.replace(files_hash, 'filesHash', sinon.fake.resolves(filesChanged));

    const cache = await getCache(cwd);

    refute.isNull(cache);
    assert.same(lru_cache.get(cwd), cache);
    assert.same(cache.filesChanged, filesChanged);
  });

  it('returns null if absolute eslint path cannot be resolved', async () => {
    sinon.replace(files_hash, 'filesHash', sinon.fake());
    sinon.replace(eslint_path, 'resolve', sinon.fake.returns(null));

    const cache = await getCache('./some/path');

    assert.isNull(cache);
    refute.called(files_hash.filesHash);
  });

  it('returns same cache on second call if filesChanged is null', async () => {
    sinon.replace(files_hash, 'filesHash', sinon.fake.resolves(null));

    const cache_1 = await getCache(cwd);
    const cache_2 = await getCache(cwd);

    assert.same(cache_1, cache_2);
  });

  it('returns same cache on second call if filesChanged returns false',
    async () => {
      const filesChanged = sinon.fake.resolves(false);
      sinon.replace(files_hash, 'filesHash', sinon.fake.resolves(filesChanged));

      const cache_1 = await getCache(cwd);
      const cache_2 = await getCache(cwd);

      assert.calledOnce(filesChanged);
      assert.same(cache_1, cache_2);
    });

  it('returns new cache on second call if filesChanged returns true',
    async () => {
      const filesChanged = sinon.fake.resolves(true);
      sinon.replace(files_hash, 'filesHash', sinon.fake.resolves(filesChanged));

      const cache_1 = await getCache(cwd);
      const cache_2 = await getCache(cwd);

      assert.calledOnce(filesChanged);
      refute.same(cache_1, cache_2);
      assert.same(cache_1.filesChanged, cache_2.filesChanged);
    });

  it('returns new cache on second call if cwd is different',
    async () => {
      sinon.replace(files_hash, 'filesHash',
        sinon.fake(() => Promise.resolve(sinon.fake())));

      const cache_1 = await getCache(cwd);
      const cache_2 = await getCache('./other/path');

      refute.same(cache_1, cache_2);
      assert.calledTwice(files_hash.filesHash);
      assert.calledWith(files_hash.filesHash, cwd);
      assert.calledWith(files_hash.filesHash, './other/path');
      refute.same(cache_1.filesChanged, cache_2.filesChanged);
      refute.called(cache_1.filesChanged);
      refute.called(cache_2.filesChanged);
    });
});
