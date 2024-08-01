import net from 'node:net';
import supportsColor from 'supports-color';
import { removeConfig } from '../lib/config.js';

/**
 * @import { Config} from '../lib/config.js'
 * @import { Resolver} from '../lib/resolver.js'
 */

const EXIT_TOKEN_REGEXP = new RegExp(/EXIT([0-9]{3})/);
const EXIT_TOKEN_LENGTH = 7;

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
    process.cwd(),
    process.argv
  ];
  socket.write(JSON.stringify(args));
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
        if (content.length > EXIT_TOKEN_LENGTH) {
          const message_length = content.length - EXIT_TOKEN_LENGTH;
          // Write everything we are sure doesn't contain the termination code:
          process.stdout.write(content.substring(0, message_length));
          // Keep only what we haven't written yet:
          content = content.substring(message_length);
        }
      }
    })
    .on('end', () => {
      // The remaining 'content' must be the termination code:
      const match = content.match(EXIT_TOKEN_REGEXP);
      if (match) {
        process.exitCode = Number(match[1]);
        return;
      }

      process.stdout.write(content);
      console.error('eslint_d: unexpected response');
      process.exitCode = 1;
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
