# eslint\_d

[![Build Status]](https://travis-ci.org/mantoni/eslint_d.js)
[![SemVer]](http://semver.org)
[![License]](https://github.com/mantoni/eslint\_d.js/blob/master/LICENSE)

Makes [eslint][] the fastest linter on the planet.

## "But eslint is pretty fast already, right?"

Yes, it's really fast. But the node.js startup time and loading all the
required modules slows down linting times for a single file to ~700
milliseconds. `eslint_d` reduces this overhead by running a server in the
background. It brings the linting time down to ~160 milliseconds. If you want
to lint from within your editor whenever you save a file, `eslint_d` is for
you.

## Install

This will install the `eslint_d` command globally:

```bash
$ npm install -g eslint_d
```

## Usage

To start the server and lint a file, just run:

```bash
$ eslint_d file.js
```

On the initial call, the `eslint_d` server is launched and then the given file
is linted. Subsequent invocations are super fast.

## How does this work?

The first time you use `eslint_d`, a little server is started in the background
and bound to a random port. The port number is stored along with [a
token][change401] in `~/.eslint_d`. You can then run `eslint_d` commands the
same way you would use `eslint` and it will delegate to the background server.
It will load a [separate instance][change220] of eslint for each working
directory to make sure settings are kept local. If eslint is found in the
current working directories `node_modules` folder, then this version of eslint
is going to be used. Otherwise, the version of eslint that ships with
`eslint_d` is used as a fallback.

To keep the memory footprint low, `eslint_d` keeps only the last 10 used
instances in the internal [nanolru][] cache.

## What if eslint or a plugin is updated?

The cached version of eslint and the Node `require` cache for the current
working directory are cleared whenever a change to one of these files is
detected: `package.json`, `package-lock.json`, `npm-shrinkwrap.json` and
`yarn.lock`. If changes are not automatically detected, remember to run
`eslint_d restart` to bounce the background server.

## Which versions of eslint are supported?

As of `v7.2.0`, you can use `eslint_d` with multiple projects depending on
different versions of eslint. Supported versions are 4.0+, 5.0+ and 6.0+.

## Commands

Control the server like this:

```bash
$ eslint_d <command>
```

Available commands:

- `start`: start the server
- `stop`: stop the server
- `status`: print out whether the server is currently running
- `restart`: restart the server
- `[options] file.js [file.js] [dir]`: invoke `eslint` with the given options.
  The `eslint` engine will be created in the current directory. If the server
  is not yet running, it is started.

Type `eslint_d --help` to see the supported `eslint` options.

`eslint_d` will select a free port automatically and store the port number
along with an access token in `~/.eslint_d`.

## Editor integration

### Linting

- __Sublime__: Check out [SublimeLinter-contrib-eslint\_d][SublimeLinter].
- __Vim__: Install the [syntastic][] plugin, then make sure this is in your
  `.vimrc`:

    ```vim
    let g:syntastic_javascript_checkers = ['eslint']
    let g:syntastic_javascript_eslint_exec = 'eslint_d'
    ```

- __WebStorm__: Configure your IDE to point to the `eslint_d` package instead
  of `eslint`. In the ESLint configuration dialog, under 'ESLint package',
  select your `eslint_d` package.
- __Atom__: You will not gain any performance from this module as it already
  avoids starting a new node instance and uses the API directly (see [this
  AtomLinter issue](https://github.com/AtomLinter/linter-eslint/issues/215)).
- __Emacs__: Use [flycheck](http://www.flycheck.org/) with the
  `javascript-eslint` checker:

    ```elisp
    (setq flycheck-javascript-eslint-executable "eslint_d")
    ```

If you're using `eslint_d` in any other editor, please let us know!

### Automatic Fixing

`eslint_d` has an additional flag that `eslint` does not have,
`--fix-to-stdout` which prints the fixed file to stdout. This allows editors to
add before save hooks to automatically fix a file prior to saving. It must be
used with `--stdin`.

- __Vim__: Add this to your `.vimrc` to lint the current buffer or visual
  selection on `<leader>f`:

    ```vim
    " Autofix entire buffer with eslint_d:
    nnoremap <leader>f mF:%!eslint_d --stdin --fix-to-stdout<CR>`F
    " Autofix visual selection with eslint_d:
    vnoremap <leader>f :!eslint_d --stdin --fix-to-stdout<CR>gv
    ```

- __Emacs__: See [eslintd-fix](https://github.com/aaronjensen/eslintd-fix)

## Moar speed

If you're really into performance and want the lowest possible latency, talk to
the `eslint_d` server with netcat. This will also eliminate the node.js startup
time.

```bash
$ PORT=`cat ~/.eslint_d | cut -d" " -f1`
$ TOKEN=`cat ~/.eslint_d | cut -d" " -f2`
$ echo "$TOKEN $PWD file.js" | nc localhost $PORT
```

Or if you want to work with stdin:

```bash
$ echo "$TOKEN $PWD --stdin" | cat - file.js | nc localhost $PORT
```

This runs `eslint` in under `50ms`!

**Tip** For additional speed, did you know that you can lint only files that
have changed? This is a feature of normal `eslint`, but it also works from
`eslint_d`. Run:

```bash
$ eslint_d . --cache
```

## References

If you're interested in building something similar to this: Most of the logic
was extracted to [core_d][], a library that manages the background server.

## Compatibility

- `9.0.0`: eslint 4.0+, 5.0+, 6.0+ and 7.0+, node 10, 12 and 14
- `8.0.0`: eslint 4.0+, 5.0+ and 6.0+, node 8, 10 and 12
- `7.2.0`: eslint 4.0+ and 5.0+, node 6, 8 and 10
- `7.0.0`: eslint 5.4+, node 6, 8 and 10
- `6.0.0`: eslint 5.0+, node 6+ (eslint dropped node 4)
- `5.0.0`: eslint 4.0+
- `4.0.0`: eslint 3.0+, node 4+ (eslint dropped node 0.10 and 0.12)
- `3.0.0`: eslint 2.2+
- `1.0.0`, `2.0.0`: eslint 1.4+, node 4 (and probably older)

## License

MIT

[Build Status]: https://img.shields.io/travis/mantoni/eslint_d.js/master.svg
[SemVer]: https://img.shields.io/:semver-%E2%9C%93-brightgreen.svg
[License]: https://img.shields.io/npm/l/eslint_d.svg
[eslint]: https://eslint.org
[SublimeLinter]: https://github.com/roadhump/SublimeLinter-contrib-eslint_d
[syntastic]: https://github.com/scrooloose/syntastic
[change220]: https://github.com/mantoni/eslint_d.js/blob/master/CHANGES.md#220
[change401]: https://github.com/mantoni/eslint_d.js/blob/master/CHANGES.md#401
[nanolru]: https://github.com/s3ththompson/nanolru
[core_d]: https://github.com/mantoni/core_d.js
