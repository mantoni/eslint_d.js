# Changes

## 7.1.0

### Automatic cache flushing on common package manager file modification:

When updating eslint or a plugin, like prettier, eslint\_d had to be restarted
with `eslint_d restart` to pick up the changes. With this release, the internal
cache is discarded and a new instance is created when one of these files is
touched: `package.json`, `package-lock.json`, `npm-shrinkwrap.json` or
`yarn.lock`.

- [`0176ec5`](https://github.com/mantoni/eslint_d.js/commit/0176ec55d08ebf7f4ac209ce402ea96a1b988e86)
  Check mtime of common package manager files
- [`39c56bc`](https://github.com/mantoni/eslint_d.js/commit/39c56bc1d7686aa5316cde34362bec30e57cf82d)
  Document automatic cache flushing

## 7.0.0

### Highlights:

- The source level of this module was [changed to ES 6][pull 91]
- Node support is now explicitly stated to be Node 6, 8 and 10
- The [new unit test suite][pull 91] is executed on [Travis][travis] with all
  supported Node versions
- `eslint_d` now ships with eslint `^5.4.0`.

### Commits:

- [`312c35e`](https://github.com/mantoni/eslint_d.js/commit/312c35ee7a76bd199feae2910fc7df25d008e532)
  Move start and restart to client
- [`42bbb54`](https://github.com/mantoni/eslint_d.js/commit/42bbb54343817dc76faa6ace8745e6eb34791f4f)
  Fix superfluous newline on socket "end" event
- [`64c1d6d`](https://github.com/mantoni/eslint_d.js/commit/64c1d6d67d03938c36d4749b5d217712982987b1)
  Refactor `client.js`
- [`685fcf0`](https://github.com/mantoni/eslint_d.js/commit/685fcf05d7779fbc359233e6bae5f65b09a1dfc0)
  Refactor `server.js`
- [`88cb781`](https://github.com/mantoni/eslint_d.js/commit/88cb78197ccbe56869ff4a2c8f7f1e8526d343ca)
  Remove unnecessary try-catch
- [`afefb2f`](https://github.com/mantoni/eslint_d.js/commit/afefb2f1e29803f683b3bf5c360ec0241b1a3a01)
  Extract `resolveModules` helper
- [`4c70735`](https://github.com/mantoni/eslint_d.js/commit/4c707356d0b2a93e4d5595bf2cf125f0d8682792)
  Consolidate `connect` logic
- [`d979eca`](https://github.com/mantoni/eslint_d.js/commit/d979ecaae1f577a1518020da81d7188968a9b0f7)
  Improve compatibility notes in readme
- [`a55d177`](https://github.com/mantoni/eslint_d.js/commit/a55d177a5c772018818d74237bb5641a2daff819)
  Update dependencies
- [`240732c`](https://github.com/mantoni/eslint_d.js/commit/240732c2dfce8dada22404cdac013fded22b103a)
  Move `--no-color` handling into client.js
- [`017e78f`](https://github.com/mantoni/eslint_d.js/commit/017e78f2b9bbd39c7397e966113fe55d78b5c709)
  Add tests for `linter.js`
- [`97f1e10`](https://github.com/mantoni/eslint_d.js/commit/97f1e10662501b744c2bc7d099e566fef3462843)
  Add tests for `server.js`
- [`b7739ec`](https://github.com/mantoni/eslint_d.js/commit/b7739ecaaddda3b23308ea910cab32f1ad4521e7)
  Refactor `daemon.js` out of `server.js`
- [`d793f4c`](https://github.com/mantoni/eslint_d.js/commit/d793f4cbb823a9c1babf9f0c07155e917de623c2)
  Do not call `process.stdout.write` directly
- [`451978d`](https://github.com/mantoni/eslint_d.js/commit/451978d8ca4a003b1ec84f149b0625936f8c403b)
  Add tests for `client.js`
- [`907847c`](https://github.com/mantoni/eslint_d.js/commit/907847c9da8ad7dc059dc059a8ba072bd7d69fd0)
  Use https links and point build badge to master
- [`0518785`](https://github.com/mantoni/eslint_d.js/commit/0518785f88e5c16b8955c29b25f84c668801d53b)
  Add tests for `launcher.js`
- [`33eb49b`](https://github.com/mantoni/eslint_d.js/commit/33eb49bd0371b40d86637378cc0e81f0fed8e324)
  Add tests for `portfile.js`
- [`05e990d`](https://github.com/mantoni/eslint_d.js/commit/05e990de1cce0072af57b16b01cd2c49b2b4fa9f)
  Add travis config, build badge
- [`d25082a`](https://github.com/mantoni/eslint_d.js/commit/d25082aba33e75a9ace3d036dd9b506cbd4b39ac)
  Switch eslint config to `@studio/eslint-config`

[pull 91]: https://github.com/mantoni/eslint_d.js/pull/91
[travis]: https://travis-ci.org/mantoni/eslint_d.js

## 6.0.1

- [`acfe398`](https://github.com/mantoni/eslint_d.js/commit/acfe3986d3e7cc523fd4fbfab05e73f52fcd6338)
  Fix color support (#88)
- [`6851625`](https://github.com/mantoni/eslint_d.js/commit/6851625d2e767cb4d73a8d0f8eab54281d59bf7b)
  Upgrade supports-color to v5
- [`23cb9c2`](https://github.com/mantoni/eslint_d.js/commit/23cb9c248004c190e32bcdd291a14c737b5a74b5)
  Remove direct chalk dependency
    > Chalk is required relative to eslint, so the direct dependency is not
    > being used.
- [`745e013`](https://github.com/mantoni/eslint_d.js/commit/745e013387beaf08dd0a98ab1cf84ed028aed329)
  Add commit hashes in changelog

## 6.0.0

- Upgrade to eslint 5 (Aaron Jensen)

## 5.3.1

- Fix vulnerabilities by updating eslint

## 5.3.0

- Use nanolru to limit the number of cached instances
    > This also enhances the status command to show the number of cached
    > instances.
- Document cache eviction and link to nanolru

## 5.2.2

- Connect to 127.0.0.1 instead of localhost (#84) (Joseph Frazier)
    > If `localhost` doesn't resolve to `127.0.0.1`, the client cannot connect
    > to the server. This issue arose in
    > https://github.com/josephfrazier/prettier_d/pull/7, and I ported the
    > changes from there.

## 5.2.1

- fix(launcher): passthrough environment variables (#81) (Huáng Jùnliàng)

## 5.2.0

- Force all open connections to close when the server is stopped (#79) (Aaron Jensen)
    > This is a less graceful approach to stopping the server, but it allows for
    > editors to hold a connection open to make for an even faster response time.

 This was primarily implemented to allow [eslintd-fix][] to hold a connection
 open to reduce latency when a fix is performed.

[eslintd-fix]: https://github.com/aaronjensen/eslintd-fix

## 5.1.0

- Allow using the `--stdin` flag with netcat (#74) (Caleb Eby)
- Refactor `portfile.read` to a single async fs call

## 5.0.0

- Eslint 4 (#71) (Simen Bekkhus)
- Update readme with eslint 4 (#72) (Simen Bekkhus)
- Use [@studio/changes][] for release and remove `Makefile`

[@studio/changes]: https://github.com/javascript-studio/studio-changes

## 4.2.5

Add `.vimrc` example for buffer auto-fixing to README.

## 4.2.4

Exit with status 1 when an error occurs. Fixes [#63][issue 63].

[issue 63]: https://github.com/mantoni/eslint_d.js/issues/63

## 4.2.2

Fix `--fix-to-stdout` when used with an ignored file.

## 4.2.1

Fix [`--fix-to-stdout` when used with an empty file][pull 59].

[pull 59]: https://github.com/mantoni/eslint_d.js/pull/59

## 4.2.0

An exciting new feature comes to eslint_d, the first one that is not part of
eslint itself. [Aaron Jensen implemented][pull 53] `--fix-to-stdout` which
allows to integrated `eslint --fix` into your editor as a save action 🎉

Currently, this feature only works with `--stdin` and you can test it like this:

```
$ cat ./some/file.js | eslint_d --fix-to-stdout --stdin
```

[pull 53]: https://github.com/mantoni/eslint_d.js/pull/53

## 4.1.0

Support for `--print-config` was [added by Aaron Jensen][pull 51]. He also
added instructions for Emacs users.

[pull 51]: https://github.com/mantoni/eslint_d.js/pull/51

## 4.0.1

Fixes a security issue that was [noticed by Andri Möll][issue 45]. Thanks for
reporting! To avoid CSRF attacks, this [introduces a security token][pull 46]
that must be sent by clients on each request. This change also binds the daemon
explicitly to `127.0.0.1` instead of implicitly listening on all network
interfaces.

[issue 45]: https://github.com/mantoni/eslint_d.js/issues/45
[pull 46]: https://github.com/mantoni/eslint_d.js/pull/46

## 4.0.0

Use ESLint 3.

## 3.1.2

Back-ported the security fix from `v4.0.1`.

## 3.1.1

As per a [recent change in eslint][bda5de5] the default parser `espree` [was
removed][pull 43]. The `eslint` dependency was bumped to `2.10.2` which
introduced the change.

[bda5de5]: https://github.com/eslint/eslint/commit/bda5de5
[pull 43]: https://github.com/mantoni/eslint_d.js/pull/43

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
