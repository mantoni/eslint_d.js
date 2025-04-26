import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import debug from 'debug';
import { configFile, writeConfig, removeConfig } from './config.js';
import { createService } from './service.js';

process.title = 'eslint_d';

const argv = process.argv.slice(2);
const ppid = Number(argv[0]);
const idle = Number(argv[1]);
const resolver = {
  base: argv[2],
  bundled: false, // not used in daemon
  require: createRequire(import.meta.url)
};
const hash = argv[3];

const log = debug('eslint_d:daemon');

const token = crypto.randomBytes(8).toString('hex');

let ppid_interval = null;
let idle_timeout = null;
/** @type {fs.FSWatcher | null} */
let watcher = null;

let service = createService(resolver, token, shutdown);
if (idle) {
  log('Using idle %d', idle);
  service = watchConnection(service, idle * 60000);
}

const server = net.createServer({ allowHalfOpen: true }, service);
server.listen(0, '127.0.0.1', () => {
  const port = server.address()?.['port'];
  log('Listening on port %d', port);
  writeConfig(resolver, { token, port, pid: process.pid, hash })
    .then(() => {
      watchConfig();
    })
    .catch((err) => {
      log('Error writing config: %o', err);
      console.error(`eslint_d: ${err}`);
      shutdown();
    });
});

process.on('SIGTERM', () => {
  log('Shutting down due to SIGTERM');
  shutdown();
});

if (ppid) {
  log('Using ppid %d', ppid);
  ppid_interval = setInterval(() => {
    try {
      process.kill(ppid, 0);
    } catch {
      log('Shutting down due to parent exit');
      shutdown();
    }
  }, 1000);
}

const project_pkg = path.resolve(resolver.base, '../../package.json');
fs.readFile(project_pkg, 'utf8', (err, data) => {
  if (!err) {
    try {
      const { name } = JSON.parse(data);
      if (name) {
        setProcessTitle(`eslint_d - ${name === 'eslint_d' ? 'global' : name}`);
        return;
      }
    } catch {
      // Fall through
    }
  }
  setProcessTitle(`eslint_d - ${process.cwd()}`);
});

/**
 * @param {string} title
 */
function setProcessTitle(title) {
  log('Setting process title to "%s"', title);
  process.title = title;
}

function shutdown() {
  if (idle_timeout) {
    clearTimeout(idle_timeout);
    idle_timeout = null;
  }
  if (ppid_interval) {
    clearInterval(ppid_interval);
    ppid_interval = null;
  }
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  server.close((err) => {
    if (err) {
      log('Error closing server: %o', err);
    }
    removeConfig(resolver).then(() => {
      log('Shutdown complete');
      // eslint-disable-next-line n/no-process-exit
      process.exit(0);
    });
  });
}

function watchConfig() {
  watcher = fs
    .watchFile(configFile(resolver), { persistent: false })
    .on('change', (type) => {
      if (type === 'rename') {
        log('Shutting down due to config removal');
        shutdown();
      }
    })
    .on('error', (err) => {
      log('Error watching config: %o', err);
      console.error(`eslint_d: ${err}`);
      shutdown();
    });
}

/**
 * @typedef {ReturnType<createService>} Service
 */
/**
 * @param {Service} delegate
 * @param {number} ms_idle
 * @returns {Service}
 */
function watchConnection(delegate, ms_idle) {
  idle_timeout = setTimeout(shutdown, ms_idle);

  return (con) => {
    clearTimeout(idle_timeout);
    idle_timeout = setTimeout(shutdown, ms_idle);
    return delegate(con);
  };
}
