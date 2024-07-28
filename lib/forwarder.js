import net from 'node:net';
import supportsColor from 'supports-color';
import { removeConfig } from '../lib/config.js';

/**
 * @import { Config} from '../lib/config.js'
 * @import { Resolver} from '../lib/resolver.js'
 */

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
        if (content.length > 5) {
          process.stdout.write(content.substring(0, content.length - 5));
          content = content.substring(content.length - 5);
        }
      }
    })
    .on('end', () => {
      if (content.startsWith('EXIT')) {
        process.exitCode = Number(content.slice(4));
      } else {
        process.stdout.write(content);
        console.error('eslint_d: unexpected response');
        process.exitCode = 1;
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
