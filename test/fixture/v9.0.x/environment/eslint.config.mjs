export default [
  {
    rules: {
      'no-alert': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-debugger':
        process.env.ESLINT_D_TEST_RULE === 'enabled' ? 'error' : 'off'
    }
  }
];
