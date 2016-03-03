# Changes

## 3.1.0

The `eslint_d` command will now exit with code 1 if errors where reported.

## 3.0.1

A [fix was provided by ruanyl][pull #33] to resolve `chalk` relative from the
actually resolved eslint module.

[pull #33]: https://github.com/mantoni/eslint_d.js/pull/33

## 3.0.0

jpsc got the [eslint 2 upgrade][pull #30] started. `eslint_d` will now use
eslint 2.2+ if no local install of eslint is found.

Also in this release:

- Support `--inline-config` and `--cache-location` options
- Pass `cwd` through to eslint.

[pull #30]: https://github.com/mantoni/eslint_d.js/pull/30

## 2.5.1

- Fix `--fix`
- Fix color for local eslint

## 2.5.0

- Support color and the `--no-color` option (fixes [issue #7][])
- Improve formatting in "Editor integration" documentation

[issue #7]: https://github.com/mantoni/eslint_d.js/issues/7

## 2.4.0

Roger Zurawicki [figured out][pull #24] how to make `eslint_d` work in WebStorm.

- Add information about `--cache` in the readme (netei)
- Add symlink to `eslint.js` for WebStorm compat (Roger Zurawicki)

[pull #24]: https://github.com/mantoni/eslint_d.js/pull/24

## 2.3.2

Fixes an error in case no local eslint module can be found (Kevin Yue)

- [Issue #17](https://github.com/mantoni/eslint_d.js/issues/17)
- [Pull request #18](https://github.com/mantoni/eslint_d.js/pull/18)

## 2.3.1

- Remove `concat-stream` dependency and micro optimizations (Richard Herrera)

## 2.3.0

Richard Herrera implemented a missing eslint feature to [lint text provided via
stdin][]. This also fixes [issue #13][].

[lint text provided via stdin]: https://github.com/mantoni/eslint_d.js/pull/15
[issue #13]: https://github.com/mantoni/eslint_d.js/issues/13

## 2.2.0

Resolves the `eslint` module for each working directory separately. This allows
multiple versions of eslint to co-exist. This is required to support local
plugins like the `babel-eslint` parser (see [issue #10][]). If no local eslint
install is found, the one that was installed with `eslint_d` is used.

[issue #10]: https://github.com/mantoni/eslint_d.js/issues/10

## 2.1.2

Fixes [issue #9][] with space-containing config path or other shell parameters
that need escaping.

[issue #9]: https://github.com/mantoni/eslint_d.js/issues/9

## 2.1.1

Fixes [issue #8][] on Windows when launching in a `cmd` shell where `eslint_d`
was hanging indefinitely.

- Update Sublime linter URL to it's new home
- Add note for Atom users

[issue #8]: https://github.com/mantoni/eslint_d.js/issues/8

## 2.1.0

Make `eslint_d` work out of the box in vim with the syntastic eslint checker.

- Add `--version` and `-v` options
- Do not start server when called with `-h` or `--help`
- Downgrade `optionator` to align with eslint
- Update instructions for vim integration

## 2.0.0

This realease support (almost) all `eslint` options. Check `eslint_d --help`.

Breaking that API already: The `lint` command was removed and in case you're
not passing a control command like `start`, `stop`, `restart` or `status`, the
given options are passed to the linter.

Also, the default output format was changed from `compact` to `stylish` to
align with `eslint`.

- Document vim syntastic javascript checkers (Chris Gaudreau)
- invokations -> invocations (Juho Vepsäläinen)
- Document Sublime editor integration
- Handle linter exceptions

## 1.0.0

- Initial release
