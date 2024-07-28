import { sinon } from '@sinonjs/referee-sinon';

export const mochaHooks = {
  afterEach() {
    sinon.restore();
  }
};
