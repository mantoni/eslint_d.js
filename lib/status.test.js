import net from 'node:net';
import { PassThrough } from 'node:stream';
import { assert, sinon } from '@sinonjs/referee-sinon';
import { status } from './status.js';

describe('lib/status', () => {
  let socket;
  const config = { token: 'token', port: 123, pid: 456, hash: 'hash' };

  beforeEach(() => {
    socket = new PassThrough();
    sinon.replace(socket, 'write', sinon.fake());
    sinon.replace(socket, 'end', sinon.fake());
    sinon.replace(net, 'connect', sinon.fake.returns(socket));
    sinon.replace(console, 'log', sinon.fake());
  });

  /**
   * @param {boolean} isAlive
   */
  function setDaemonState(isAlive) {
    sinon.replace(
      socket,
      'on',
      sinon.fake((event, cb) => {
        if (isAlive && event !== 'error') {
          cb();
        }
        if (!isAlive && event === 'error') {
          cb();
        }
        return socket;
      })
    );
  }

  it('prints status when running and bundled', async () => {
    setDaemonState(true);
    const resolver = {
      base: '/path/to/eslint',
      bundled: true,
      require: sinon.fake.returns({ version: '1.2.3' })
    };

    await status(resolver, config);

    assert.calledOnceWith(
      console.log,
      'eslint_d: Running (456) - bundled eslint v1.2.3'
    );
  });

  it('prints status when running and local', async () => {
    setDaemonState(true);
    const resolver = {
      base: '/path/to/eslint',
      bundled: false,
      require: sinon.fake.returns({ version: '1.2.3' })
    };

    await status(resolver, config);

    assert.calledOnceWith(
      console.log,
      'eslint_d: Running (456) - local eslint v1.2.3'
    );
  });

  it('prints status when not running and bundled', async () => {
    setDaemonState(false);
    const resolver = {
      base: '/path/to/eslint',
      bundled: true,
      require: sinon.fake.returns({ version: '1.2.3' })
    };

    await status(resolver, null);

    assert.calledOnceWith(
      console.log,
      'eslint_d: Not running - bundled eslint v1.2.3'
    );
  });

  it('prints status when not running and local', async () => {
    setDaemonState(false);
    const resolver = {
      base: '/path/to/eslint',
      bundled: false,
      require: sinon.fake.returns({ version: '1.2.3' })
    };

    await status(resolver, null);

    assert.calledOnceWith(
      console.log,
      'eslint_d: Not running - local eslint v1.2.3'
    );
  });
});
