import { assert, sinon } from '@sinonjs/referee-sinon';
import { help } from './help.js';

describe('lib/help', () => {
  it('prints help', () => {
    sinon.replace(console, 'log', sinon.fake());

    help();

    assert.calledOnceWithMatch(
      console.log,
      /^eslint_d \[options\] file\.js \[file\.js\] \[dir\]\n\n/gm
    );
  });
});
