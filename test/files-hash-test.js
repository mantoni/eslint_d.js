/*eslint-env mocha*/
'use strict';

const fs = require('fs').promises;
const { assert, sinon } = require('@sinonjs/referee-sinon');
const { filesHash } = require('../lib/files-hash');

describe('files-hash', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('reads file contents of given files concurrently', () => {
    sinon.replace(fs, 'readFile', sinon.fake.returns(sinon.promise()));

    filesHash('some/path', ['a', 'b']);

    assert.calledTwice(fs.readFile);
    assert.calledWith(fs.readFile, 'some/path/a');
    assert.calledWith(fs.readFile, 'some/path/b');
  });

  it('returns null if none of the files exist', async () => {
    sinon.replace(fs, 'readFile', sinon.fake.rejects(new Error()));

    const hasChanges = await filesHash('.', ['a', 'b']);

    assert.isNull(hasChanges);
  });

  it('returns a function if one of the files exists', async () => {
    sinon.replace(fs, 'readFile', sinon.fake((file) => {
      if (file === 'a') {
        return Promise.reject(new Error());
      }
      return Promise.resolve(Buffer.from('"use strict";'));
    }));

    const hasChanges = await filesHash('.', ['a', 'b']);

    assert.isFunction(hasChanges);
  });

  it('reads the files again when invoking the returned function', async () => {
    sinon.replace(fs, 'readFile',
      sinon.fake.resolves(Buffer.from('"use strict;"')));

    const hasChanges = await filesHash('some/dir', ['a', 'b']);
    await hasChanges();

    assert.callCount(fs.readFile, 4);
    assert.equals(fs.readFile.args[0], ['some/dir/a']);
    assert.equals(fs.readFile.args[1], ['some/dir/b']);
    assert.equals(fs.readFile.args[2], ['some/dir/a']);
    assert.equals(fs.readFile.args[3], ['some/dir/b']);
  });

  it('only reads the files again that succeeded initially', async () => {
    sinon.replace(fs, 'readFile', sinon.fake((file) => {
      if (file === 'a') {
        return Promise.reject(new Error());
      }
      return Promise.resolve(Buffer.from('"use strict";'));
    }));

    const hasChanges = await filesHash('.', ['a', 'b']);
    const changed = await hasChanges();

    assert.isFalse(changed);
    assert.callCount(fs.readFile, 3);
    assert.equals(fs.readFile.args[0], ['a']);
    assert.equals(fs.readFile.args[1], ['b']);
    assert.equals(fs.readFile.args[2], ['b']);
  });

  it('returns false if the only file did not change', async () => {
    sinon.replace(fs, 'readFile',
      sinon.fake.resolves(Buffer.from('"use strict";')));

    const hasChanges = await filesHash('.', ['a']);
    const changed = await hasChanges();

    assert.isFalse(changed);
  });

  it('returns false if none of the files changed', async () => {
    sinon.replace(fs, 'readFile',
      sinon.fake((file) => Promise.resolve(Buffer.from(file))));

    const hasChanges = await filesHash('.', ['a', 'b']);
    const changed = await hasChanges();

    assert.isFalse(changed);
  });

  it(`returns false if none of the files changed and promises resolved in
      different order`, async () => {
    sinon.replace(fs, 'readFile', sinon.fake(() => sinon.promise()));

    const files_hash_promise = filesHash('.', ['a', 'b']);
    await fs.readFile.getCall(0).returnValue.resolve(Buffer.from('x'));
    await fs.readFile.getCall(1).returnValue.resolve(Buffer.from('y'));

    const hasChanges = await files_hash_promise;
    const changed_promise = hasChanges();
    await fs.readFile.getCall(3).returnValue.resolve(Buffer.from('y'));
    await fs.readFile.getCall(2).returnValue.resolve(Buffer.from('x'));

    assert.isFalse(await changed_promise);
  });

  it('returns true if the only file changed', async () => {
    let calls = 0;
    sinon.replace(fs, 'readFile', sinon.fake(() => {
      return Promise.resolve(Buffer.from(String(calls++)));
    }));

    const hasChanges = await filesHash('.', ['a']);
    const changed = await hasChanges();

    assert.isTrue(changed);
  });

  it('returns true if one of the files changed', async () => {
    let calls = 0;
    sinon.replace(fs, 'readFile', sinon.fake((file) => {
      if (file === 'a') {
        return Promise.resolve(Buffer.from('"use strict";'));
      }
      return Promise.resolve(Buffer.from(String(calls++)));
    }));

    const hasChanges = await filesHash('.', ['a', 'b']);
    const changed = await hasChanges();

    assert.isTrue(changed);
  });
});
