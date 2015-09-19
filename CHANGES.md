# Changes

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
