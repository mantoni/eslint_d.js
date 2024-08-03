import withRelatedTests from '@studio/related-tests';

export default {
  '*.js': ['eslint --fix', withRelatedTests('mocha')],
  '*.{js,json,md}': 'prettier --write'
};
