/*eslint-env mocha*/
'use strict';

const fs = require('fs');
const crypto = require('crypto');
const { assert, refute, sinon } = require('@sinonjs/referee-sinon');
const portfile = require('../lib/portfile');

const home_env = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
const data_file = `${process.env[home_env]}/.eslint_d`;
const token = crypto.randomBytes(8).toString('hex');

describe('portfile', () => {

  describe('write', () => {

    it('writes port and token', () => {
      sinon.replace(fs, 'writeFileSync', sinon.fake());

      portfile.write(8765, token);

      // eslint-disable-next-line no-sync
      assert.calledOnceWith(fs.writeFileSync, data_file, `8765 ${token}`);
    });

  });

  describe('read', () => {

    it('reads port and token', () => {
      sinon.replace(fs, 'readFile', sinon.fake.yields(null, `8765 ${token}`));
      const callback = sinon.spy();

      portfile.read(callback);

      assert.calledOnceWith(fs.readFile, data_file, 'utf8', sinon.match.func);
      assert.calledOnceWith(callback, { port: 8765, token });
    });

    it('yields null on error', () => {
      sinon.replace(fs, 'readFile', sinon.fake.yields(new Error()));
      const callback = sinon.spy();

      portfile.read(callback);

      assert.calledOnceWith(callback, null);
    });

  });

  describe('unlink', () => {

    it('unlinks portfile', () => {
      sinon.replace(fs, 'existsSync', sinon.fake.returns(true));
      sinon.replace(fs, 'unlinkSync', sinon.fake());

      portfile.unlink();

      // eslint-disable-next-line no-sync
      assert.calledOnceWith(fs.existsSync, data_file);
      // eslint-disable-next-line no-sync
      assert.calledOnceWith(fs.unlinkSync, data_file);
    });

    it('does not attempt to delete portfile if it doesn\'t exist', () => {
      sinon.replace(fs, 'existsSync', sinon.fake.returns(false));
      sinon.replace(fs, 'unlinkSync', sinon.fake());

      portfile.unlink();

      // eslint-disable-next-line no-sync
      refute.called(fs.unlinkSync);
    });

  });

});
