import studio_eslint_config from '@studio/eslint-config';

export default [
  ...studio_eslint_config,
  {
    ignores: ['bin/eslint.js', 'test/fixture/fail.js', 'coverage-reports']
  }
];
