export function help() {
  console.log(`eslint_d [options] file.js [file.js] [dir]

All arguments are passed to eslint, except for the following commands:

  start           Start the daemon
  stop            Stop the daemon
  restart         Restart the daemon
  status          Show daemon status, process id and resolved eslint version
  --help, -h      Show this help
  --version, -v   Show version number of eslint_d and bundled eslint
  --fix-to-stdout Print fixed file to stdout (requires --stdin)

Environment variables:

  ESLINT_D_PPID   Parent process id to monitor. If the parent process dies, the
                  daemon exits as well. "0" disables monitoring (default), and
                  "auto" monitors the parent process that started eslint_d.
  ESLINT_D_IDLE   Number of minutes of inactivity before the daemon exits.
                  Defaults to "0" if ESLINT_D_PPID is set, otherwise "15".
  ESLINT_D_MISS   How to behave if local eslint is missing. "fallback" uses the
                  bundled eslint (default). "fail" logs an error and exits with
                  code 1. "ignore" silently exits with code 0.
`);
}
