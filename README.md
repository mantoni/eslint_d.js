# eslint\_d

[![SemVer]](http://semver.org)
[![License]](https://github.com/mantoni/eslint\_d.js/blob/master/LICENSE)

Makes [eslint][] the fastest linter on the planet.

## "But eslint is pretty fast already, right?"

Yes, it's actually super fast. But the node.js startup time and loading all the
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

However, the performance gain comes at a small price: Changes in the eslint
settings are only picked up after a server restart, so you will have to
remember to run `eslint_d restart` after tweaking this rule or installing that
plugin. Also, when you have a lot of projects that use eslint, it might use
quite a bit of ram for cached instances. All memory can be freed up by running
`eslint_d stop` or `eslint_d restart`.

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

If you're using `eslint_d` in any other editor, please tell me!

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

This runs `eslint` in under `50ms`!

**Tip** For additional speed, did you know that you can lint only files that
have changed? This is a feature of normal `eslint`, but it also works from
`eslint_d`. Run:

```bash
$ eslint_d . --cache
```

## Compatibility

- `4.0.0`: eslint 3.0+
- `3.0.0`: eslint 2.2+
- `1.0.0`, `2.0.0`: eslint 1.4+

## License

MIT

[SemVer]: http://img.shields.io/:semver-%E2%9C%93-brightgreen.svg
[License]: http://img.shields.io/npm/l/eslint_d.svg
[eslint]: http://eslint.org
[SublimeLinter]: https://github.com/roadhump/SublimeLinter-contrib-eslint_d
[syntastic]: https://github.com/scrooloose/syntastic
[change220]: https://github.com/mantoni/eslint_d.js/blob/master/CHANGES.md#220
[change401]: https://github.com/mantoni/eslint_d.js/blob/master/CHANGES.md#401
