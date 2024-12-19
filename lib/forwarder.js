import debug from 'debug';
import net from 'node:net';
import supportsColor from 'supports-color';
import { removeConfig } from '../lib/config.js';
import { LINT_COMMAND, PING_COMMAND } from './commands.js';
import { launchDaemon } from './launcher.js';

/**
 * @import { Config } from './config.js'
 * @import { Resolver } from './resolver.js'
 */

const EXIT_TOKEN_REGEXP = new RegExp(/EXIT([0-9]{3})/);
const EXIT_TOKEN_LENGTH = 7;

const log = debug('eslint_d:forwarder');

/**
 * @param {Config | null} config
 * @returns {Promise<boolean>}
 */
export async function isAlive(config) {
  try {
    await forwardCommandToDaemon(config, PING_COMMAND);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {Config | null} config
 * @param {string} command
 * @returns {Promise<void>}
 */
export async function forwardCommandToDaemon(config, command) {
  if (!config) {
    return Promise.reject(new Error('Config not found'));
  }

  const socket = await connectToDaemon(config);
  log('Request: %o', { token: config.token, command });
  socket.write(JSON.stringify([config.token, command]));
  socket.end();

  return new Promise((resolve, reject) => {
    socket.on('end', resolve).on('error', reject);
  });
}

/**
 * @param {Resolver} resolver
 * @param {Config} config
 */
export async function forwardToDaemon(resolver, config) {
  const eslint_args = process.argv.slice();
  const text = process.argv.includes('--stdin') ? await readStdin() : null;
  const { stdout } = supportsColor;

  const fix_to_stdout_index = eslint_args.indexOf('--fix-to-stdout');
  const fix_to_stdout = fix_to_stdout_index !== -1;

  if (fix_to_stdout) {
    if (!eslint_args.includes('--stdin')) {
      console.error('--fix-to-stdout requires passing --stdin as well');
      // eslint-disable-next-line require-atomic-updates
      process.exitCode = 1;
      return;
    }
    eslint_args.splice(
      fix_to_stdout_index,
      1,
      '--fix-dry-run',
      '--format',
      'json'
    );
  }

  let socket;
  try {
    socket = await createSocket(true);
  } catch (err) {
    console.error(`eslint_d: ${err}`);
    // eslint-disable-next-line require-atomic-updates
    process.exitCode = 1;
    return;
  }

  const color_level = stdout ? stdout.level : 0;
  const cwd = process.cwd();
  const DEBUG = process.env.DEBUG || '';
  log('Request: %o', {
    token: config.token,
    command: LINT_COMMAND,
    color_level,
    cwd,
    args: eslint_args,
    DEBUG
  });
  const args = [
    config.token,
    LINT_COMMAND,
    color_level,
    cwd,
    eslint_args,
    DEBUG
  ];
  socket.write(JSON.stringify(args));
  if (text) {
    log('Request stdin: %d', text.length);
    socket.write('\n');
    socket.write(text);
  }
  socket.end();

  let content = '';
  socket
    .setEncoding('utf8')
    .on('readable', () => {
      let chunk = '';
      while ((chunk = socket.read()) !== null) {
        content += chunk;
        if (!fix_to_stdout && content.length > EXIT_TOKEN_LENGTH) {
          process.stdout.write(flushMessage());
        }
      }
    })
    .on('end', () => {
      // The remaining 'content' must be the termination code:
      const match = content.match(EXIT_TOKEN_REGEXP);
      if (!match) {
        process.stdout.write(content);
        console.error('eslint_d: unexpected response');
        process.exitCode = 1;
        return;
      }

      if (!fix_to_stdout) {
        const exit_code = Number(match[1]);
        log('Exit %d', exit_code);
        process.exitCode = exit_code;
        return;
      }

      try {
        const { output } = JSON.parse(flushMessage())[0];
        process.stdout.write(output || text);
        // Exit code from eslint is deliberately ignored in this case
        log('Exit %d', 0);
        process.exitCode = 0;
      } catch (err) {
        process.stdout.write(text);
        console.error(`eslint_d: ${err}`);
        process.exitCode = 1;
      }
    })
    .on('error', (err) => {
      console.error(`eslint_d: ${err}`);
      process.exitCode = 1;
    });

  /**
   * @param {boolean} retry
   * @returns {Promise<net.Socket>}
   */
  async function createSocket(retry) {
    try {
      return await connectToDaemon(config);
    } catch (/** @type {any} */ err) {
      log('Failed to connect %o', err);

      if (err['code'] === 'ECONNREFUSED' && retry) {
        await removeConfig(resolver);
        // @ts-expect-error we check for nullability in the line below
        // eslint-disable-next-line require-atomic-updates
        config = await launchDaemon(resolver, config.hash);
        if (!config) {
          throw new Error('Unable to start daemon');
        }
        return createSocket(false);
      }

      if (err['code'] === 'ECONNREFUSED') {
        await removeConfig(resolver);
        throw new Error(`${err.message} - removing config`);
      }

      throw err;
    }
  }

  /**
   * @returns {string}
   */
  function flushMessage() {
    const message_length = content.length - EXIT_TOKEN_LENGTH;
    // Extract everything we are sure doesn't contain the termination code:
    const message = content.substring(0, message_length);
    // Keep only what we haven't written yet:
    content = content.substring(message_length);
    return message;
  }
}

/**
 * @param {Config} config
 * @returns {Promise<net.Socket>}
 */
function connectToDaemon(config) {
  log('Connecting to daemon 127.0.0.1:%d', config.port);
  return new Promise((resolve, reject) => {
    const socket = net.connect(config.port, '127.0.0.1');
    socket
      .on('connect', () => {
        socket.off('error', reject);
        resolve(socket);
      })
      .once('error', reject);
  });
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let content = '';
    process.stdin
      .setEncoding('utf8')
      .on('readable', () => {
        let chunk = '';
        while ((chunk = process.stdin.read()) !== null) {
          content += chunk;
        }
      })
      .on('end', () => resolve(content))
      .on('error', reject);
  });
}
