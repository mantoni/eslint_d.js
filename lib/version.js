import { createRequire } from 'node:module';

export function version() {
  const require = createRequire(import.meta.url);
  console.log(
    `eslint_d: v${require('../package.json').version}, bundled eslint: v${require('eslint/package.json').version}`
  );
}
