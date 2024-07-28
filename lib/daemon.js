import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
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

const token = crypto.randomBytes(8).toString('hex');

let ppid_interval = null;
let idle_timeout = null;
/** @type {fs.FSWatcher | null} */
let watcher = null;

let service = createService(resolver, token);
if (idle) {
  service = watchConnection(service, idle * 60000);
}
const server = net.createServer({ allowHalfOpen: true }, service);

server.listen(0, '127.0.0.1', () => {
  const port = server.address()?.['port'];
  writeConfig(resolver, { token, port, pid: process.pid, hash })
    .then(() => {
      watchConfig();
    })
    .catch((err) => {
      console.error(`eslint_d: ${err}`);
      shutdown();
    });
});

process.on('SIGTERM', shutdown);

if (ppid) {
  ppid_interval = setInterval(() => {
    try {
      process.kill(ppid, 0);
    } catch {
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
        process.title = `eslint_d - ${name === 'eslint_d' ? 'global' : name}`;
        return;
      }
    } catch {
      // Fall through
    }
  }
  process.title = `eslint_d - ${process.cwd()}`;
});

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
  server.close(() =>
    removeConfig(resolver).then(() => {
      // eslint-disable-next-line n/no-process-exit
      process.exit(0);
    })
  );
}

function watchConfig() {
  watcher = fs
    .watch(configFile(resolver), { persistent: false })
    .on('change', (type) => {
      if (type === 'rename') {
        shutdown();
      }
    })
    .on('error', (err) => {
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
