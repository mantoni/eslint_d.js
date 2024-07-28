import { assert, refute, sinon } from '@sinonjs/referee-sinon';
import { miss } from './miss.js';

describe('lib/miss', () => {
  beforeEach(() => {
    sinon.replace(console, 'log', sinon.fake());
    sinon.replace(console, 'error', sinon.fake());
    process.exitCode = 0;
  });

  ['start', 'stop', 'restart'].forEach((command) => {
    it(`logs error for ${command} and sets exitCode to 1`, () => {
      miss('ignore', command);

      assert.calledOnceWith(
        console.error,
        `eslint_d: Cannot ${command} - local eslint not found`
      );
      assert.equals(process.exitCode, 1);
      refute.called(console.log);
    });
  });

  it(`logs status and does not change exitCode`, () => {
    miss('ignore', 'status');

    assert.calledOnceWith(
      console.log,
      'eslint_d: Not running - local eslint not found'
    );
    assert.equals(process.exitCode, 0);
    refute.called(console.error);
  });

  it('does nothing if not a command and resolver is "ignore"', () => {
    miss('ignore', 'file.js');

    refute.called(console.error);
    refute.called(console.log);
    assert.equals(process.exitCode, 0);
  });

  it('sets exitCode to 1 and logs nothing if not a command and resolver is "fail"', () => {
    miss('fail', 'file.js');

    refute.called(console.error);
    refute.called(console.log);
    assert.equals(process.exitCode, 1);
  });
});
