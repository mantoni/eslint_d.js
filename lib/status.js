/**
 * @import { Resolver } from './resolver.js'
 * @import { Config } from './config.js'
 */

/**
 * @param {Resolver} resolver
 * @param {Config | null} config
 */
export function status(resolver, config) {
  const running = config ? `Running (${config.pid})` : 'Not running';
  const eslint_origin = resolver.bundled ? 'bundled' : 'local';
  const eslint_version = resolver.require(
    `${resolver.base}/package.json`
  ).version;
  console.log(
    `eslint_d: ${running} - ${eslint_origin} eslint v${eslint_version}`
  );
}
