import net from 'node:net';
import supportsColor from 'supports-color';
import { removeConfig } from '../lib/config.js';

/**
 * @import { Config} from '../lib/config.js'
 * @import { Resolver} from '../lib/resolver.js'
 */

/* Maximum number of characters of all eslint exit codes */
const EXIT_CODE_MAX_LENGTH = 2;

/* The string sent by our daemon upon termination */
const DAEMON_EXIT_TOKEN = 'EXIT';

const DAEMON_TERMINATION_CODE_MAX_LENGTH =
  DAEMON_EXIT_TOKEN.length + EXIT_CODE_MAX_LENGTH;
const DAEMON_TERMINATION_CODE_REGEXP = new RegExp(
  `${DAEMON_EXIT_TOKEN}([0-9]{1,${EXIT_CODE_MAX_LENGTH}})`
);

/**
 * @param {Resolver} resolver
 * @param {Config} config
 */
export async function forwardToDaemon(resolver, config) {
  const text = process.argv.includes('--stdin') ? await readStdin() : null;
  const { stdout } = supportsColor;

  const socket = net.connect(config.port, '127.0.0.1');
  const args = [
    config.token,
    stdout ? stdout.level : 0,
    JSON.stringify(process.cwd()),
    JSON.stringify(process.argv)
  ];
  socket.write(args.join(' '));
  if (text) {
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
        if (content.length > DAEMON_TERMINATION_CODE_MAX_LENGTH) {
          const message_length =
            content.length - DAEMON_TERMINATION_CODE_MAX_LENGTH;
          // write everything we are sure doesn't contain the termination code:
          process.stdout.write(content.substring(0, message_length));
          // keep only what we haven't written yet:
          content = content.substring(message_length);
        }
      }
    })
    .on('end', () => {
      // search the end of 'content' for the termination code:
      const endOfContent = content.slice(-DAEMON_TERMINATION_CODE_MAX_LENGTH);
      const match = endOfContent.match(DAEMON_TERMINATION_CODE_REGEXP);

      if (!match) {
        process.stdout.write(content);
        console.error('eslint_d: unexpected response');
        process.exitCode = 1;
        return;
      }

      // write everything but the termination code:
      content = content.slice(
        0,
        -DAEMON_TERMINATION_CODE_MAX_LENGTH + (match.index || 0)
      );

      process.exitCode = Number(match[1]);

      if (content) {
        process.stdout.write(content);
      }
    })
    .on('error', async (err) => {
      if (err['code'] === 'ECONNREFUSED') {
        console.error(`eslint_d: ${err} - removing config`);
        await removeConfig(resolver);
      } else {
        console.error(`eslint_d: ${err}`);
      }
      process.exitCode = 1;
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
