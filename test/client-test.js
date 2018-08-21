/*eslint-env mocha*/
'use strict';

const net = require('net');
const crypto = require('crypto');
const EventEmitter = require('events');
const supports_color = require('supports-color');
const { assert, refute, sinon } = require('@sinonjs/referee-sinon');
const out = require('../lib/out');
const client = require('../lib/client');
const portfile = require('../lib/portfile');
const launcher = require('../lib/launcher');

const token = crypto.randomBytes(8).toString('hex');

function enableColor() {
  const replacement = typeof supports_color.stdout === 'boolean' ? true : {};
  sinon.replace(supports_color, 'stdout', replacement);
}

function disableColor() {
  const replacement = typeof supports_color.stdout === 'boolean' ? false : null;
  sinon.replace(supports_color, 'stdout', replacement);
}

describe('client', () => {
  let socket;

  beforeEach(() => {
    socket = new EventEmitter();
    socket.end = sinon.fake();
    sinon.replace(out, 'write', sinon.fake());
  });

  afterEach(() => {
    sinon.restore();
    delete process.exitCode;
  });

  function verifyNotRunning(method, ...args) {
    sinon.replace(portfile, 'read', sinon.fake.yields(null));

    client[method](...args);

    assert.calledOnceWith(out.write, 'Not running\n');
    refute.defined(process.exitCode);
  }

  function verifyCouldNotConnect(method, ...args) {
    sinon.replace(portfile, 'read', sinon.fake.yields({ port: 4321, token }));
    sinon.replace(net, 'connect', sinon.fake.returns(socket));

    client[method](...args);

    assert.calledOnceWith(net.connect, 4321, '127.0.0.1', sinon.match.func);

    socket.emit('error', new Error());

    assert.calledOnceWith(out.write, 'Could not connect\n');
    assert.equals(process.exitCode, 1);
  }

  describe('start', () => {

    it('invokes launcher', () => {
      sinon.replace(launcher, 'launch', sinon.fake());

      client.start();

      assert.calledOnce(launcher.launch);
      refute.called(out.write);
    });

    it('prints "Could not connect" if connection fails', () => {
      verifyCouldNotConnect('start');
    });

    it('prints "Already running" if connection succeeds', () => {
      sinon.replace(portfile, 'read', sinon.fake.yields({ port: 4321, token }));
      sinon.replace(net, 'connect', sinon.fake.returns(socket));

      client.start();
      net.connect.firstCall.callback();

      assert.calledOnceWith(out.write, 'Already running\n');
    });

  });

  describe('status', () => {

    it('prints "Not running" if portfile cannot be read', () => {
      verifyNotRunning('status');
    });

    it('prints "Could not connect" if connection fails', () => {
      verifyCouldNotConnect('status');
    });

    it('sends token and "status" command to server', () => {
      sinon.replace(portfile, 'read', sinon.fake.yields({ port: 4321, token }));
      sinon.replace(net, 'connect', sinon.fake.returns(socket));

      client.status();
      net.connect.firstCall.callback();

      assert.calledOnceWith(socket.end, `${token} status`);

      socket.emit('data', 'Some response');
      socket.emit('end');
      assert.calledWith(out.write, 'Some response');
      refute.defined(process.exitCode);
    });

  });

  describe('stop', () => {

    it('prints "Not running" if portfile cannot be read', () => {
      verifyNotRunning('stop');
    });

    it('prints "Could not connect" if connection fails', () => {
      verifyCouldNotConnect('stop');
    });

    it('still invokes callback if "Not running"', () => {
      const callback = sinon.fake();

      verifyNotRunning('stop', callback);

      assert.calledOnce(callback);
    });

    it('does not invoke callback if "Could not connect"', () => {
      const callback = sinon.fake();

      verifyCouldNotConnect('stop', callback);

      refute.called(callback);
    });

    it('sends token and "stop" command to server', () => {
      sinon.replace(portfile, 'read', sinon.fake.yields({ port: 4321, token }));
      sinon.replace(net, 'connect', sinon.fake.returns(socket));
      const callback = sinon.fake();

      client.stop(callback);
      net.connect.firstCall.callback();

      assert.calledOnceWith(socket.end, `${token} stop`);
      refute.called(out.write);
      refute.called(callback);

      socket.end.firstCall.callback();

      assert.calledOnce(callback);
      refute.defined(process.exitCode);
    });

    it('writes server output back to connection', () => {
      sinon.replace(portfile, 'read', sinon.fake.yields({ port: 4321, token }));
      sinon.replace(net, 'connect', sinon.fake.returns(socket));

      client.stop();
      net.connect.firstCall.callback();

      socket.emit('data', 'Some response');
      socket.emit('end');
      assert.calledWith(out.write, 'Some response');
      refute.defined(process.exitCode);
    });

    it('does not write empty line on end', () => {
      sinon.replace(portfile, 'read', sinon.fake.yields({ port: 4321, token }));
      sinon.replace(net, 'connect', sinon.fake.returns(socket));

      client.stop();
      net.connect.firstCall.callback();

      socket.emit('end');

      refute.called(out.write);
    });

    it('does not fail if no callback was given', () => {
      sinon.replace(portfile, 'read', sinon.fake.yields({ port: 4321, token }));
      sinon.replace(net, 'connect', sinon.fake.returns(socket));

      client.stop();
      net.connect.firstCall.callback();

      refute.exception(() => {
        socket.end.firstCall.callback();
      });
    });

  });

  describe('restart', () => {

    it('invokes stop and start', (done) => {
      sinon.replace(client, 'stop', sinon.fake.yields());
      sinon.replace(client, 'start', sinon.fake());

      client.restart();

      setTimeout(() => {
        assert.calledOnce(client.stop);
        assert.calledOnce(client.start);
        assert.callOrder(client.stop, client.start);
        done();
      }, 1);
    });

    it('does not invoke start if stop does not yield', (done) => {
      sinon.replace(client, 'stop', sinon.fake());
      sinon.replace(client, 'start', sinon.fake());

      client.restart();

      setTimeout(() => {
        refute.called(client.start);
        done();
      }, 1);
    });

  });

  describe('lint', () => {
    const cwd = process.cwd();
    const args = ['--some', '-t'];
    const text = '"use strict";\nconsole.log("Lint this!");';

    function lint() {
      sinon.replace(portfile, 'read', sinon.fake.yields({ port: 4321, token }));
      sinon.replace(net, 'connect', sinon.fake.returns(socket));

      client.lint(args, text);
      net.connect.firstCall.callback();
    }

    function verifyLinting() {
      const json = JSON.stringify({ cwd, args, text });
      assert.calledOnceWith(socket.end, `${token} ${json}`);

      socket.emit('data', 'Some response');
      socket.emit('end');
      assert.calledOnceWith(out.write, 'Some response');
      refute.defined(process.exitCode);
    }

    it('sends token and { cwd, args, text } to server', () => {
      enableColor();

      lint();

      verifyLinting();
    });

    it('sets exitCode to 1 if response ends with `# exit 1`', () => {
      lint();

      socket.emit('data', 'Some response\n# exit 1');
      socket.emit('end');

      assert.calledOnceWith(out.write, 'Some response\n');
      assert.equals(process.exitCode, 1);
    });

    it('streams lines', () => {
      lint();

      socket.emit('data', 'Some ');
      socket.emit('data', 'response\nfrom ');
      socket.emit('data', 'eslint');
      socket.emit('end');

      assert.calledWith(out.write, 'Some response\n');
      assert.calledWith(out.write, 'from eslint');
      refute.defined(process.exitCode);
    });

    function launch() {
      sinon.replace(portfile, 'read', sinon.fake.yields(null));
      sinon.replace(launcher, 'launch', sinon.fake());

      client.lint(args, text);
    }

    it('invokes launcher if not running, then lints', () => {
      launch();

      assert.calledOnce(launcher.launch);
    });

    it('send token and json to server once launched successfully', () => {
      enableColor();
      launch();

      launcher.launch.firstCall.callback(null, socket, token);

      verifyLinting();
    });

    it('fails if launcher fails', () => {
      launch();

      launcher.launch.firstCall.callback('Could not connect');

      assert.calledOnceWith(out.write, 'Could not connect\n');
      assert.equals(process.exitCode, 1);
    });

    it('does not invoke launcher on connection failure', () => {
      sinon.replace(portfile, 'read', sinon.fake.yields({ port: 4321, token }));
      sinon.replace(net, 'connect', sinon.fake.returns(socket));
      sinon.replace(launcher, 'launch', sinon.fake());

      client.lint(args, text);
      socket.emit('error', new Error());

      refute.called(launcher.launch);
      assert.calledOnceWith(out.write, 'Could not connect\n');
      assert.equals(process.exitCode, 1);
    });

    it('adds --no-color option if stdout does not support colors', () => {
      disableColor();

      lint();

      const json = JSON.stringify({
        cwd,
        args: ['--no-color', '--some', '-t'],
        text
      });
      assert.calledOnceWith(socket.end, `${token} ${json}`);
    });

  });

});
