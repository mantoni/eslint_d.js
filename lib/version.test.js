import fs from 'node:fs/promises';
import { assert, sinon } from '@sinonjs/referee-sinon';
import { version } from './version.js';

describe('lib/version', () => {
  it('prints eslint_d and bundled eslint versions', async () => {
    sinon.replace(console, 'log', sinon.fake());

    version();

    // Using a different way to resolve versions than the implementation:
    const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const pkg_lock = JSON.parse(await fs.readFile('package-lock.json', 'utf8'));
    const bundled_eslint = pkg_lock.packages['node_modules/eslint'].version;
    assert.calledOnceWith(
      console.log,
      `eslint_d: v${pkg.version}, bundled eslint: v${bundled_eslint}`
    );
  });
});
