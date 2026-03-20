import { createRequire } from 'node:module';
import { LINT_COMMAND, PING_COMMAND, SHUTDOWN_COMMAND } from './commands.js';

/**
 * @import { Socket } from 'node:net'
 * @import { Resolver } from './resolver.js'
 */

const stdout_write = process.stdout.write;
const stderr_write = process.stderr.write;

/**
 * Detect Eslint major version.
 *
 * @param {Resolver} resolver
 * @param {require} require
 * @returns {number}
 */
export function eslintMajorVersion(resolver, require) {
  const { version } = require(`${resolver.base}/package.json`);
  return Number(version.split('.')[0]);
}

/**
 * Eslint v10 doesn't use chalk anymore.
 * Return undefined if chalk is unused.
 *
 * @param {Resolver} resolver
 * @param {require} require
 * @returns {object | undefined}
 */
export function importChalk(resolver, require) {
  try {
    const major = eslintMajorVersion(resolver, require);
    if (major < 10) {
      const chalk = require('chalk');
      if (Object.isExtensible(chalk)) {
        // An extra check for the perverse case of eslint >=v10 and
        // chalk v5 (ESM) that should never occur.
        return chalk;
      }
    }
  } catch {
    /* noop */
  }
  return undefined;
}

/**
 * @param {Resolver} resolver
 * @param {string} token
 * @param {function(): void} shutdown
 * @returns {function(Socket): void} con
 */
export function createService(resolver, token, shutdown) {
  const eslint = resolver.require(`${resolver.base}/lib/cli.js`);
  const require = createRequire(`${resolver.base}/`);
  const chalk = importChalk(resolver, require);
  const debug = require('debug');
  const log = debug('eslint_d:service');
  const debug_global = process.env.DEBUG || '';
  if (debug_global) {
    debug.enable(debug_global);
  }
  let debug_last = debug_global;

  return (con) => {
    log('New connection');
    let content = '';
    con
      .setEncoding('utf8')
      .on('readable', () => {
        let chunk;
        while ((chunk = con.read()) !== null) {
          content += chunk;
        }
      })
      .on('end', async () => {
        if (!content) {
          log('Empty request');
          con.end();
          return;
        }

        const newline = content.indexOf('\n');
        let text = null;
        if (newline !== -1) {
          text = content.slice(newline + 1);
          content = content.slice(0, newline);
        }
        const [request_token, command, color_level, cwd, argv, DEBUG] =
          JSON.parse(content);

        const debug_invoke = DEBUG || debug_global;
        if (debug_invoke !== debug_last) {
          if (debug_invoke === '') {
            debug.disable();
          } else {
            debug.enable(debug_invoke);
          }
          debug_last = debug_invoke;
        }

        if (!debug_global) {
          process.stderr.write =
            /** @type {function(Uint8Array | string): boolean} */ (
              (chunk) => con.write(chunk)
            );
        }

        log('Request: %o', {
          request_token,
          command,
          color_level,
          cwd,
          argv,
          DEBUG
        });
        if (text) {
          log('Request stdin: %d', text.length);
        }

        if (request_token !== token) {
          log('Invalid token');
          process.stderr.write = stderr_write;
          con.end();
          return;
        }
        if (command !== LINT_COMMAND) {
          log('Executing command %s', command);
          try {
            onCommand(con, command);
          } finally {
            process.stderr.write = stderr_write;
          }
          return;
        }

        if (chalk) {
          chalk.level = color_level;
        }
        process.chdir(cwd);

        process.stdout.write =
          /** @type {function(Uint8Array | string): boolean} */ (
            (chunk) => con.write(chunk)
          );

        log('Executing eslint');
        let code = 1;
        try {
          code = await eslint.execute(argv, text, true);
        } catch (e) {
          log('Error from eslint: %o', e);
          con.write(String(e));
        } finally {
          log('Exit code from eslint: %d', code);
          /* eslint-disable require-atomic-updates */
          process.stdout.write = stdout_write;
          process.stderr.write = stderr_write;
          /* eslint-enable require-atomic-updates */
          con.end(`EXIT${String(code).padStart(3, '0')}`);
        }
      })
      .on('error', (e) => {
        log('Error from connection: %o', e);
        process.stdout.write = stdout_write;
        process.stderr.write = stderr_write;
      });
  };

  /**
   * @param {Socket} con
   * @param {string} command
   */
  function onCommand(con, command) {
    switch (command) {
      case SHUTDOWN_COMMAND:
        shutdown();
        break;
      case PING_COMMAND:
        break;
      default:
        con.write(`Unknown command: ${command}`);
    }

    con.end();
    con.destroySoon();
  }
}
