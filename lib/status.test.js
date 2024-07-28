import { assert, sinon } from '@sinonjs/referee-sinon';
import { status } from './status.js';

describe('lib/status', () => {
  const config = { token: 'token', port: 123, pid: 456, hash: 'hash' };

  beforeEach(() => {
    sinon.replace(console, 'log', sinon.fake());
  });

  it('prints status when running and bundled', () => {
    const resolver = {
      base: '/path/to/eslint',
      bundled: true,
      require: sinon.fake.returns({ version: '1.2.3' })
    };

    status(resolver, config);

    assert.calledOnceWith(
      console.log,
      'eslint_d: Running (456) - bundled eslint v1.2.3'
    );
  });

  it('prints status when running and local', () => {
    const resolver = {
      base: '/path/to/eslint',
      bundled: false,
      require: sinon.fake.returns({ version: '1.2.3' })
    };

    status(resolver, config);

    assert.calledOnceWith(
      console.log,
      'eslint_d: Running (456) - local eslint v1.2.3'
    );
  });

  it('prints status when not running and bundled', () => {
    const resolver = {
      base: '/path/to/eslint',
      bundled: true,
      require: sinon.fake.returns({ version: '1.2.3' })
    };

    status(resolver, null);

    assert.calledOnceWith(
      console.log,
      'eslint_d: Not running - bundled eslint v1.2.3'
    );
  });

  it('prints status when not running and local', () => {
    const resolver = {
      base: '/path/to/eslint',
      bundled: false,
      require: sinon.fake.returns({ version: '1.2.3' })
    };

    status(resolver, null);

    assert.calledOnceWith(
      console.log,
      'eslint_d: Not running - local eslint v1.2.3'
    );
  });
});
