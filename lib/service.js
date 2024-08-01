import { createRequire } from 'node:module';

/**
 * @import { Socket } from 'node:net'
 * @import { Resolver } from './resolver.js'
 */

const stdout_write = process.stdout.write;
const stderr_write = process.stderr.write;

/**
 * @param {Resolver} resolver
 * @param {string} token
 * @returns {function(Socket): void} con
 */
export function createService(resolver, token) {
  const eslint = resolver.require(`${resolver.base}/lib/cli.js`);
  const chalk = createRequire(resolver.base)('chalk');

  return (con) => {
    let content = '';
    con
      .setEncoding('utf8')
      .on('readable', () => {
        let chunk = '';
        while ((chunk = con.read()) !== null) {
          content += chunk;
        }
      })
      .on('end', async () => {
        if (!content) {
          con.end();
          return;
        }

        const newline = content.indexOf('\n');
        let text = null;
        if (newline !== -1) {
          text = content.slice(newline + 1);
          content = content.slice(0, newline);
        }
        const [request_token, color_level, cwd, argv] = JSON.parse(content);
        if (request_token !== token) {
          con.end();
          return;
        }

        chalk.level = color_level;
        process.chdir(cwd);

        process.stdout.write = (chunk) => con.write(chunk);
        process.stderr.write = (chunk) => con.write(chunk);
        let code = 1;
        try {
          code = await eslint.execute(argv, text, true);
        } catch (e) {
          con.write(String(e));
        } finally {
          /* eslint-disable require-atomic-updates */
          process.stdout.write = stdout_write;
          process.stderr.write = stderr_write;
          /* eslint-enable require-atomic-updates */
          con.end(`EXIT${String(code).padStart(3, '0')}`);
        }
      })
      .on('error', () => {
        process.stdout.write = stdout_write;
        process.stderr.write = stderr_write;
      });
  };
}
