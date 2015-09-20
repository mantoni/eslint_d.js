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

## Commands

Controll the server like this:

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

`eslint_d` will select a free port automatically and store the port number is
`~/.eslint_d_port`.

## Editor integration

- __Sublime__: [SublimeLinter-eslint][]
- __Vim__: Install the [syntastic][] plugin, then make sure this is in your
  `.vimrc`:

```vim
let g:syntastic_javascript_checkers = ['eslint']
let g:syntastic_javascript_eslint_exec = 'eslint_d'
```

If you're using `eslint_d` in any other editor, please tell me!

## Moar speed

If you're really into performance and want the lowest possible latency, talk to
the `eslint_d` server with netcat. This will also eliminate the node.js startup
time.

```bash
$ echo '. file.js' | nc localhost `cat ~/.eslint_d_port`
```

This runs `eslint` in under `50ms`!

## Compatibility

- `1.0.0`, `2.0.0`: eslint 1.4+

## License

MIT

[SemVer]: http://img.shields.io/:semver-%E2%9C%93-brightgreen.svg
[License]: http://img.shields.io/npm/l/eslint_d.svg
[eslint]: http://eslint.org
[SublimeLinter-eslint]: https://github.com/roadhump/SublimeLinter-contrib-eslint_d
[syntastic]: https://github.com/scrooloose/syntastic
