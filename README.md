<h1 align="center">
  eslint_d
</h1>
<p align="center">
  <b>🪄 Speed up eslint to accelerate your development workflow</b>
</p>
<div align="center">
  <a href="https://www.npmjs.com/package/eslint_d">
    <img src="https://img.shields.io/npm/v/eslint_d.svg" alt="npm Version">
  </a>
  <a href="https://semver.org">
    <img src="https://img.shields.io/:semver-%E2%9C%93-blue.svg" alt="SemVer">
  </a>
  <a href="https://github.com/mantoni/eslint_d.js/actions">
    <img src="https://github.com/mantoni/eslint_d.js/workflows/Build/badge.svg" alt="Build Status">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/npm/l/eslint_d.svg" alt="License">
  </a>
  <br>
  <br>
  <br>
</div>

> Runs [eslint][] in a background process to improve linting time while editing.
> On a MacBook Air M1 with node.js v22.2.0 and eslint v9.8.0:

```bash
❯ eslint file.js # ~500ms
❯ eslint_d file.js # ~115ms
```

## Features

- Supports all eslint versions from v4 to v9.
- Supports all LTS versions of node.js.
- Automatically starts, stops and restarts the background server.
- Binds to parent process, editor process or exits after IDLE time.
- Falls back to bundled eslint if local eslint is missing.

## Setup

```bash
❯ npm i -g eslint_d
```

### Vim

- With [ale][]:

  ```vim
  let $ESLINT_D_PPID = getpid()
  let g:ale_javascript_eslint_executable = 'eslint_d'
  let g:ale_javascript_eslint_use_global = 1
  ```

- With [syntastic][]:

  ```vim
  let $ESLINT_D_PPID = getpid()
  let g:syntastic_javascript_checkers = ['eslint']
  let g:syntastic_javascript_eslint_exec = 'eslint_d'
  ```

### WebStorm

Configure your IDE to point to the `eslint_d` package instead of `eslint`. In
the ESLint configuration dialog, under 'ESLint package', select your `eslint_d`
package.

### Emacs

Use [flycheck][] with the `javascript-eslint` checker:

```elisp
(setq flycheck-javascript-eslint-executable "eslint_d")
```

### Sublime

The official [SublimeLinter-eslint][] plugin automatically prefers `eslint_d`
if it finds one.

### Atom, VSCode

You will not gain any performance from this module as these editors already
cache eslint instances for you.

---

If you're using `eslint_d` in any other editor, please let us know!

## Commands

`eslint_d` is a drop-in replacement for `eslint`. It forwards all arguments to
`eslint` and starts the background server if necessary:

```
eslint_d [options] file.js [file.js] [dir]
```

All arguments are passed to eslint, except for the following commands:

```
  start           Start the daemon
  stop            Stop the daemon
  restart         Restart the daemon
  status          Show daemon status, process id and resolved eslint version
  --help, -h      Show this help
  --version, -v   Show version number of eslint_d and bundled eslint
  --fix-to-stdout Print fixed file to stdout (requires --stdin)
```

## Environment variables

- `ESLINT_D_PPID` Parent process id to monitor. If the parent process dies, the
  daemon exits as well. "0" disables monitoring (default), and "auto" monitors
  the parent process that started eslint_d.
- `ESLINT_D_IDLE` Number of minutes of inactivity before the daemon exits.
  Defaults to "0" if `ESLINT_D_PPID` is set, otherwise "15".
- `ESLINT_D_MISS` How to behave if local eslint is missing. "fallback" uses the
  bundled eslint (default). "fail" logs an error and exits with code 1.
  "ignore" silently exits with code 0.

## Automatic fixing

`eslint_d` has an additional option that `eslint` does not have,
`--fix-to-stdout` which prints the fixed file to stdout. This allows editors to
add before save hooks to automatically fix a file prior to saving. It must be
used with `--stdin`.

### Vim

Add this to your `.vimrc` to lint the current buffer or visual selection on
`<leader>f`:

```vim
" Autofix entire buffer with eslint_d:
nnoremap <leader>f mF:%!eslint_d --stdin --fix-to-stdout --stdin-filename %<CR>`F
" Autofix visual selection with eslint_d:
vnoremap <leader>f :!eslint_d --stdin --fix-to-stdout<CR>gv
```

### Emacs

See [eslintd-fix](https://github.com/aaronjensen/eslintd-fix)

## How does this work?

`eslint_d` starts a background server that runs `eslint` in a separate process.
It communicates with the server over a Unix domain socket. When you run
`eslint_d`, it forwards all arguments to the server and prints the result. This
is faster because node.js doesn't have to load all the required modules every
time.

By default, `eslint_d` uses the local `eslint` package if available. If the
local `eslint` package is missing, `eslint_d` falls back to the bundled
`eslint` package. You can change this behavior with the `ESLINT_D_MISS`
environment variable. To see which `eslint` package is used, run `eslint_d
status`.

A `.eslint_d` file is stored in the resolved eslint installation directory
which stores a security token, the server port and process id, and the hash of
the monitored files. If the file is removed, the server exits.

The server automatically stops after 15 minutes of inactivity. You can change
this with the `ESLINT_D_IDLE` environment variable. Alternatively, you can bind
the lifetime of the server to a parent process by setting `ESLINT_D_PPID` to
"auto" or a specific parent process id. The server will exit when the parent
process dies. Note that "auto" uses the parent process that started `eslint_d`,
which may not be the editor process.

The server is also automatically restarted if one of the following files
changed: `package.json`, `package-lock.json`, `npm-shrinkwrap.json`,
`yarn.lock`, `pnpm-lock.yaml`.

## Compatibility

- `14.0.0`: eslint 4 - 9, node 18 - 22 (ships with eslint 9) (see [^1])
- `13.0.0`: eslint 4 - 8, node 12 - 20 (ships with eslint 8)
- `12.0.0`: eslint 4 - 8, node 12 - 16 (ships with eslint 8)
- `11.0.0`: eslint 4 - 8, node 12 - 16 (ships with eslint 7)
- `10.0.0`: eslint 4 - 7, node 10 - 14 (using new `ESLint` API if available)
- `9.0.0`: eslint 4 - 7, node 10 - 14 (using `CLIEngine` API)
- `8.0.0`: eslint 4 - 6, node 8 - 12
- `7.2.0`: eslint 4 - 5, node 6 - 10
- `7.0.0`: eslint 5.4+, node 6, 8 and 10
- `6.0.0`: eslint 5.0+, node 6+ (eslint dropped node 4)
- `5.0.0`: eslint 4.0+
- `4.0.0`: eslint 3.0+, node 4+ (eslint dropped node 0.10 and 0.12)
- `3.0.0`: eslint 2.2+
- `1.0.0`, `2.0.0`: eslint 1.4+, node 4 (and probably older)

## License

MIT

[License]: https://img.shields.io/npm/l/eslint_d.svg
[eslint]: https://eslint.org
[ale]: https://github.com/dense-analysis/ale
[syntastic]: https://github.com/scrooloose/syntastic
[flycheck]: http://www.flycheck.org/
[SublimeLinter-eslint]: https://github.com/SublimeLinter/SublimeLinter-eslint

[^1]: The support for `--fix-to-stdout` is only provided with eslint 5 and beyond.
