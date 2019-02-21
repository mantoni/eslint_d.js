/*eslint-env mocha*/
'use strict';

const net = require('net');
const crypto = require('crypto');
const EventEmitter = require('events');
const child_process = require('child_process');
const { assert, refute, sinon } = require('@sinonjs/referee-sinon');
const out = require('../lib/out');
const launcher = require('../lib/launcher');
const portfile = require('../lib/portfile');

const daemon = require.resolve('../lib/daemon');
const token = crypto.randomBytes(8).toString('hex');

describe('launcher', () => {
  let clock;
  let child;
  let socket;
  let callback;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    child = { unref: sinon.fake() };
    sinon.replace(child_process, 'spawn', sinon.fake.returns(child));
    socket = new EventEmitter();
    socket.end = sinon.fake();
    callback = sinon.spy();
  });

  afterEach(() => {
    delete process.exitCode;
    delete global.eslint_d_launching;
  });

  it('launches child process', () => {
    sinon.replace(portfile, 'read', sinon.fake.yields(null));
    const callback = sinon.spy();

    launcher.launch(callback);

    assert.calledOnceWith(child_process.spawn, 'node', [daemon], {
      detached: true,
      env: sinon.match({
        FORCE_COLOR: 1
      }),
      stdio: ['ignore', 'ignore', 'ignore']
    });
    assert.calledOnce(child.unref);
    assert.calledOnce(portfile.read);
    refute.called(callback);
  });

  function launch() {
    sinon.stub(portfile, 'read').yields(null);

    launcher.launch(callback);

    portfile.read.yields({ port: 7654, token });
    return sinon.replace(net, 'connect', sinon.fake.returns(socket));
  }

  it('checks if portfile exists after delay and attempts to connect', () => {
    const connect = launch();
    clock.tick(100);

    assert.calledTwice(portfile.read);
    assert.calledOnceWith(connect, 7654, '127.0.0.1', sinon.match.func);
    refute.called(callback);
  });

  it('yields (null, socket, token) once connected', () => {
    const connect = launch();
    clock.tick(100);

    connect.firstCall.callback();

    assert.calledOnceWith(callback, null, socket, token);
  });

  it('retries every 100 milliseconds if port file is still missing', () => {
    sinon.replace(portfile, 'read', sinon.fake.yields(null));

    launcher.launch(callback);
    clock.tick(100);
    clock.tick(100);

    assert.calledThrice(portfile.read);
    refute.called(callback);
  });

  it('retries every 100 milliseconds if portfile is not written', () => {
    sinon.replace(portfile, 'read', sinon.fake());
    launcher.launch(callback);
    clock.tick(100); // initial check

    assert.calledOnce(portfile.read);

    portfile.read.lastCall.callback(null);
    clock.tick(100); // retry timeout

    assert.calledTwice(portfile.read);
    refute.called(callback);

    portfile.read.lastCall.callback(null);
    clock.tick(100); // retry timeout

    assert.calledThrice(portfile.read);
    refute.called(callback);
  });

  it('does not retry if connection fails', () => {
    launch();
    clock.tick(100); // initial check
    assert.calledTwice(portfile.read);

    socket.emit('error', new Error());

    assert.calledTwice(portfile.read);
    assert.calledOnceWith(callback, 'Could not connect');
  });

  function connectRunning() {
    sinon.replace(portfile, 'unlink', sinon.fake());
    sinon.replace(portfile, 'read', sinon.fake.yields({ port: 7654, token }));
    sinon.replace(net, 'connect', sinon.fake.returns(socket));
    launcher.launch(callback);
    clock.tick(100); // initial check
  }

  it('unlinks portfile and launches on ECONNREFUSED', () => {
    connectRunning();

    const err = new Error();
    err.code = 'ECONNREFUSED';
    socket.emit('error', err);

    assert.calledOnce(portfile.unlink);
    assert.calledOnceWith(child_process.spawn, 'node', [daemon]);
  });

  it('succeeds to connect after failed connect', () => {
    connectRunning();

    const err = new Error();
    err.code = 'ECONNREFUSED';
    socket.emit('error', err);

    assert.calledOnce(child_process.spawn);

    clock.tick(100); // initial check
    net.connect.secondCall.callback();

    assert.calledOnceWith(callback, null);
  });

  it('unlinks portfile, but does not launch again on second failure', () => {
    connectRunning();

    const err = new Error();
    err.code = 'ECONNREFUSED';
    socket.emit('error', err);

    assert.calledOnce(child_process.spawn);

    clock.tick(100); // initial check
    socket.emit('error', err);

    assert.calledTwice(portfile.unlink);
    assert.calledOnceWith(callback, 'Could not connect');
  });

  it('throws when trying to launch second instance', () => {
    sinon.stub(portfile, 'read').yields(null);
    launcher.launch(() => {});

    assert.exception(() => {
      launcher.launch(callback);
    }, {
      name: 'Error',
      message: 'Already launching'
    });
  });

  it('prints message and does not invoke callback if already running', () => {
    sinon.replace(portfile, 'read', sinon.fake.yields({ port: 7654, token }));
    sinon.replace(out, 'write', sinon.fake());
    const connect = sinon.replace(net, 'connect', sinon.fake.returns(socket));

    launcher.launch(callback);
    connect.firstCall.callback();

    assert.calledOnceWith(out.write, 'Already running\n');
    refute.called(callback);
  });

});
