/**
 * @param {'fail' | 'ignore'} resolver
 * @param {string} command
 */
export function miss(resolver, command) {
  switch (command) {
    case 'start':
    case 'stop':
    case 'restart':
      console.error(`eslint_d: Cannot ${command} - local eslint not found`);
      process.exitCode = 1;
      break;
    case 'status':
      console.log('eslint_d: Not running - local eslint not found');
      break;
    default:
      if (resolver === 'fail') {
        process.exitCode = 1;
      }
  }
}
