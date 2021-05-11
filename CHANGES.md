# Changes

## 10.1.0

- 🍏 [`48f1e1a`](https://github.com/mantoni/eslint_d.js/commit/48f1e1a6e45a753ec37d75a318365e227d29d9fd)
  Implement exit codes (Jose Alvarez)
- 🍏 [`a2f3a0e`](https://github.com/mantoni/eslint_d.js/commit/a2f3a0e69f3b14017dfb0c6bd015e04168e9faac)
  Depend on core\_d `v3.1`
- 🛡 [`fd332c2`](https://github.com/mantoni/eslint_d.js/commit/fd332c210a023cdaadd79c703d1bf40853b572cd)
  Bump lodash from 4.17.19 to 4.17.21 in /test/fixture/v6.0.x (dependabot[bot])
- 🛡 [`cd87b1f`](https://github.com/mantoni/eslint_d.js/commit/cd87b1f19c3838af9cd73cf3a6c4f85d43d25389)
  Bump lodash from 4.17.19 to 4.17.21 in /test/fixture/v5.0.x (dependabot[bot])
- 🛡 [`be57447`](https://github.com/mantoni/eslint_d.js/commit/be57447bc829a8f9707de9af4d02b1e7f2ff7c25)
  Bump lodash from 4.17.19 to 4.17.21 in /test/fixture/v4.0.x (dependabot[bot])
- 🛡 [`a37575d`](https://github.com/mantoni/eslint_d.js/commit/a37575d01ff424a965d809304289bcbb1b42e909)
  Bump lodash from 4.17.19 to 4.17.21 (dependabot[bot])
- ✨ [`2cf221b`](https://github.com/mantoni/eslint_d.js/commit/2cf221bc509cad4ab864a17883859dde1e8751b3)
  Update Studio Changes
- ✨ [`bbfc483`](https://github.com/mantoni/eslint_d.js/commit/bbfc483d6cffc9140b895f39a7ebb2746ec5e63f)
  Update semver
- ✨ [`48b94f9`](https://github.com/mantoni/eslint_d.js/commit/48b94f9c6ef7245323bf8606797c636aec8a2585)
  Update eslint
- ✨ [`10a536c`](https://github.com/mantoni/eslint_d.js/commit/10a536c1681a4e0e5c0bbed708e531c388df05e7)
  Update mocha
- ✨ [`2a468a0`](https://github.com/mantoni/eslint_d.js/commit/2a468a09eb221b68e6bfb3ca7817aba054823a74)
  Upgrade referee-sinon to latest
- ✨ [`6d1f4d0`](https://github.com/mantoni/eslint_d.js/commit/6d1f4d004025c8314ea5251e8a7f53c9ff1007fa)
  Use npm 7
- 📚 [`f47e45e`](https://github.com/mantoni/eslint_d.js/commit/f47e45edce1f20e2b7f78e4eb9d9663311dc2125)
  Add contributor

Note: If you rely on the `.eslint_d` file, please note that its
location has changed and that the `XDG_RUNTIME_DIR` is taken into
account if it exists. See the README.md file for more information.

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2021-05-09._

## 10.0.4

- 📚 [`b256c48`](https://github.com/mantoni/eslint_d.js/commit/b256c48acda89961b0f4408856bdcb216c8b624f)
  Document fix for .vue files not autofixed (#154) (Artur Tagisow)
- 📚 [`c63b44b`](https://github.com/mantoni/eslint_d.js/commit/c63b44b2aadada8c35d0992aa9fb1445ff4c107f)
  Add contributor

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2021-02-28._

## 10.0.3

- 🐛 [`c732b77`](https://github.com/mantoni/eslint_d.js/commit/c732b774b7c08f735d48ba712c994ef978770364)
  Fix `--print-config` for eslint 7+ (#153) (Dan Orzechowski)
- 📚 [`25c2921`](https://github.com/mantoni/eslint_d.js/commit/25c2921901bff600bf4c9a17ee5e9caf260ac8b0)
  Add contributors
- ✨ [`3e4c1b2`](https://github.com/mantoni/eslint_d.js/commit/3e4c1b2ef11f57fc138f72eb62d2edbdb34edc1f)
  Update Studio Changes

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2021-02-23._

## 10.0.2

- 🐛 [`bc46363`](https://github.com/mantoni/eslint_d.js/commit/bc46363454d568f1895a142ed3abc34977d8eab8)
  Generate correct help
- ✨ [`058d662`](https://github.com/mantoni/eslint_d.js/commit/058d66288632c1b9a6eb2712651b90fbe41e534e)
  Refactor eslint path resolution into own file
- ✨ [`0df364d`](https://github.com/mantoni/eslint_d.js/commit/0df364dc5f32cf4ae1467e21a034b65aaa63f180)
  Do not run builds twice on own branch PR
- ✨ [`39ab052`](https://github.com/mantoni/eslint_d.js/commit/39ab0522f94c399a7a7e7fceb5ad565b3469744f)
  Run build for PRs

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2021-02-10._

## 10.0.1

- 🐛 [`f62713b`](https://github.com/mantoni/eslint_d.js/commit/f62713b79ed41de24cb7dcfacb8d6015011e90a7)
  Unbreak `eslint_d --help` (Christian Albrecht)

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2021-02-10._

## 10.0.0

Switch to the new `ESLint` API, if available. The `CLIEngine` API has been
deprecated.

- 💥 [`ee74815`](https://github.com/mantoni/eslint_d.js/commit/ee7481526ab48f0328e02681cda6060cd5ff2085)
  **BREAKING:** Use ESLint class if available
- 📚 [`1d6227e`](https://github.com/mantoni/eslint_d.js/commit/1d6227e247562aa12207df5c092ff43ea8660279)
  Add compatibility notes for v10
- 📚 [`d67e203`](https://github.com/mantoni/eslint_d.js/commit/d67e203cf6c99dc2da5b1d9fda8fcdffcfdf435e)
  Document ale integration and not sublime issue
- 📚 [`68c4eec`](https://github.com/mantoni/eslint_d.js/commit/68c4eece628c3ba43214c651602acb10920e0cf6)
  Change badge
- ✨ [`93dba52`](https://github.com/mantoni/eslint_d.js/commit/93dba52f70f128539c3491146c189b421a3f11f8)
  Remove Travis config
- ✨ [`b8b9f3c`](https://github.com/mantoni/eslint_d.js/commit/b8b9f3cfc818cce156bd4662043ec125c2ba8be1)
  Configure GitHub actions
- ✨ [`d83c9b9`](https://github.com/mantoni/eslint_d.js/commit/d83c9b90b99bbee0d43c8d813827fc8891b771f1)
  Fix watch script
- ✨ [`e65fdb9`](https://github.com/mantoni/eslint_d.js/commit/e65fdb9771d1d87665f748d3d6eb5c08d56c35d1)
  Update mocha
- ✨ [`06d9b71`](https://github.com/mantoni/eslint_d.js/commit/06d9b71b5436aa341e695d8b03e3a164c8fd0cf0)
  Upgrade referee-sinon
- ✨ [`2b42e64`](https://github.com/mantoni/eslint_d.js/commit/2b42e64643bb9efe99b3cf5e803a0285785d254e)
  Add contributors

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2021-01-30._

## 9.1.2

Fixes an issue with `--color` / `--no-color` not working correctly.

- 🐛 [`17ae7bd`](https://github.com/mantoni/eslint_d.js/commit/17ae7bd2fbc902753fa00dea074186ebb6c5ed98)
  Use level property instead of enabled for chalk (#139) (Ibuki)
- 📚 [`c72869f`](https://github.com/mantoni/eslint_d.js/commit/c72869fd6098aa3acdbb53389e1970c44615f111)
  Update eslint version compatibilty note
- 🛡 [`646772c`](https://github.com/mantoni/eslint_d.js/commit/646772cfa30dfbd2ad284a04439f3619227c511d)
  npm audit
- 🛡 [`6d606db`](https://github.com/mantoni/eslint_d.js/commit/6d606dbf06be7bbeb7d72f089a2b801e45afb3a1)
  Bump lodash from 4.17.15 to 4.17.19 in /test/fixture/v5.16.x (dependabot[bot])
- 🛡 [`de3a6b9`](https://github.com/mantoni/eslint_d.js/commit/de3a6b9d5fc6cca80205c06e93f8487167523fdc)
  Bump lodash from 4.17.15 to 4.17.19 in /test/fixture/v4.19.x (dependabot[bot])
- 🛡 [`7380d79`](https://github.com/mantoni/eslint_d.js/commit/7380d79f28fe6766f88247abc90b7b7378d0ea6b)
  Bump lodash from 4.17.15 to 4.17.19 (dependabot[bot])
- 🛡 [`04d37b1`](https://github.com/mantoni/eslint_d.js/commit/04d37b17f8711ac55fafc213c16c1b208930158c)
  Bump lodash from 4.17.15 to 4.17.19 in /test/fixture/v6.0.x (dependabot[bot])
- 🛡 [`2816459`](https://github.com/mantoni/eslint_d.js/commit/2816459b0ad655d1a7f65ceb13bef86517f96989)
  Bump lodash from 4.17.15 to 4.17.19 in /test/fixture/v7.0.x (dependabot[bot])
- 🛡 [`f838505`](https://github.com/mantoni/eslint_d.js/commit/f838505ec30a60dbf32104994630ee78d71c5849)
  Bump lodash from 4.17.15 to 4.17.19 in /test/fixture/v6.8.x (dependabot[bot])
- 🛡 [`5a53f65`](https://github.com/mantoni/eslint_d.js/commit/5a53f65c4250409864e5df5f4e5e5bc826019b0f)
  Bump lodash from 4.17.15 to 4.17.19 in /test/fixture/v4.0.x (dependabot[bot])
- 🛡 [`195b19b`](https://github.com/mantoni/eslint_d.js/commit/195b19b950a8e49e2f5df19289f4d6ef1eecf333)
  Bump lodash from 4.17.15 to 4.17.19 in /test/fixture/v5.0.x (dependabot[bot])

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2020-09-08._

## 9.1.1

Fixes an issue with pnpm being unable to resolve `chalk`.

- 🐛 [`6f2f88d`](https://github.com/mantoni/eslint_d.js/commit/6f2f88d25a9109005f5acb45c80bfc76ed5caee9)
  Fix issue #101 (Alexander Koltun)

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2020-06-23._

## 9.1.0

- 🍏 [`836912c`](https://github.com/mantoni/eslint_d.js/commit/836912cdfebbd3934661366b2c16969a28d7a101)
  Update eslint to v7.3
- 🍏 [`09c46d6`](https://github.com/mantoni/eslint_d.js/commit/09c46d6d3884834a07e16e862226456015823aac)
  Upgrade `core_d` to v2
- 📚 [`f4f1cd3`](https://github.com/mantoni/eslint_d.js/commit/f4f1cd337b03572908d27a87024bbd067f01bad0)
  State pnpm compatibility
- ✨ [`0cd4828`](https://github.com/mantoni/eslint_d.js/commit/0cd4828cbbb412037773998e5c69587ea11eadd7)
  Upgrade Mocha to v8
- ✨ [`8e2b18e`](https://github.com/mantoni/eslint_d.js/commit/8e2b18e86a25d76a5c549d60e625408953f6d763)
  Update `@sinonjs/referee-sinon` to v7.1

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2020-06-22._

## 9.0.0

Now ships with eslint 7, drops Node 8 support, adds Node 14. Note that
`eslint_d` continues to support older eslint versions down to v4.

- 💥 [`5f14916`](https://github.com/mantoni/eslint_d.js/commit/5f14916e0391ccc958ca40b164a1ccd7a84d3d82)
  Support eslint 7
- 💥 [`e8fa144`](https://github.com/mantoni/eslint_d.js/commit/e8fa144aa9e85184876dc658612e4fab28ae828e)
  Remove node 8 from travis config
- 🍏 [`7e518b8`](https://github.com/mantoni/eslint_d.js/commit/7e518b88457d5ec2087673aa451d5167dc90c690)
  Add node 12 to travis config
- 🍏 [`71e140c`](https://github.com/mantoni/eslint_d.js/commit/71e140c7f7bfa10f9b868ce41595c9e45f4d6d2a)
  Update optionator to `v0.9.1`
- 📚 [`0b830e6`](https://github.com/mantoni/eslint_d.js/commit/0b830e640b15e8e843b80dd005d4174aa9602916)
  Update compatibility notes for `v9.0.0`
- ✨ [`c9512fc`](https://github.com/mantoni/eslint_d.js/commit/c9512fc80140cc4f8bbcfe374207e98ba86306d5)
  Upgrade Studio Changes to v2
- ✨ [`6825f70`](https://github.com/mantoni/eslint_d.js/commit/6825f7048940f8a46e7f85a4ff18df85b9b4c889)
  Upgrade to referee-sinon 7
- ✨ [`17e164f`](https://github.com/mantoni/eslint_d.js/commit/17e164f0a2726488b640e3e2cc9add11c615e583)
  Upgrade to Mocha 7
- ✨ [`875e004`](https://github.com/mantoni/eslint_d.js/commit/875e004954684df7c040f98310aaf5cb713e3340)
  Update eslint config

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2020-06-09._

## 8.1.1

Security patches.

- 🛡 [`2f0c21e`](https://github.com/mantoni/eslint_d.js/commit/2f0c21e877cf355ba65bfce4073359ce4f90a7c1)
  npm audit `v6.8.x` fixture
- 🛡 [`912818c`](https://github.com/mantoni/eslint_d.js/commit/912818c61bf213d233d36b559e434422e4a3cbcd)
  npm audit `v6.0.x` fixture
- 🛡 [`72ad6f5`](https://github.com/mantoni/eslint_d.js/commit/72ad6f57ceb6034b86eb62c4a8e2da37f594ed81)
  npm audit `v5.16.x` fixture
- 🛡 [`706250e`](https://github.com/mantoni/eslint_d.js/commit/706250e10ec39d7a3515396d3dd2962eee2a6191)
  npm audit `v5.0.x` fixture
- 🛡 [`c609c3a`](https://github.com/mantoni/eslint_d.js/commit/c609c3a7f80fbd6f40eb89253ee7f2d364db960e)
  npm audit `v4.19.x` fixture
- 🛡 [`4983414`](https://github.com/mantoni/eslint_d.js/commit/498341461aa88b6865f1773cd801e79ca0d4911d)
  npm audit `v4.0.x` fixture
- 🛡 [`ffb150a`](https://github.com/mantoni/eslint_d.js/commit/ffb150a6b094bf16437d9882321fc0ad93ef3259)
  npm audit
- 🛡 [`6e0434e`](https://github.com/mantoni/eslint_d.js/commit/6e0434e8e868ee7105fc151d58f9a08aaf2f3810)
  Bump acorn from 7.1.0 to 7.1.1 in /test/fixture/v6.8.x (dependabot[bot])
- 🛡 [`30f87d3`](https://github.com/mantoni/eslint_d.js/commit/30f87d3ba7b5bb5f20b8a98a33e4e1ebe5e78198)
  Bump acorn from 6.1.1 to 6.4.1 in /test/fixture/v6.0.x (dependabot[bot])
- 🛡 [`414a697`](https://github.com/mantoni/eslint_d.js/commit/414a697abc0f6f13fa1ca5837eefedbd34c9ef05)
  Bump acorn from 6.4.0 to 6.4.1 in /test/fixture/v5.16.x (dependabot[bot])
- 🛡 [`6e2fc82`](https://github.com/mantoni/eslint_d.js/commit/6e2fc826a71ef3be9b3240eadf48940c1077a8ee)
  Bump acorn from 6.1.1 to 6.4.1 in /test/fixture/v5.0.x (dependabot[bot])
- 🛡 [`06a6144`](https://github.com/mantoni/eslint_d.js/commit/06a61443c42dec81a99f72fa692acc1660af2335)
  Bump acorn from 6.1.1 to 6.4.1 (dependabot[bot])

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2020-03-21._

## 8.1.0

- 🍏 [`501333a`](https://github.com/mantoni/eslint_d.js/commit/501333a2518c95ff7e71051631490026b3b91984)
  Reviewed existing CLI options. Added new ESLint CLI options. (MarS)
    >
    > Added next CLI options:
    >
    > 1) `--parser-options` - Specify parser options
    > 2) `--resolve-plugins-relative-to` - A folder where plugins should be resolved from, CWD by default
    > 3) `--fix-dry-run` - Automatically fix problems without saving the changes to the file system
    > 4) `--fix-type` - Specify the types of fixes to apply (problem, suggestion, layout)
    > 5) `--report-unused-disable-directives` - Adds reported errors for unused eslint-disable directives
    > 6) `--init` - Run config initialization wizard'
    > 7) `--env-info` - Output execution environment information
    > 8) `--error-on-unmatched-pattern` - Prevent errors when pattern is unmatched
    >
- 📚 [`8abbf0d`](https://github.com/mantoni/eslint_d.js/commit/8abbf0d56ef4bbfc0ef884d81b53c778ed71a887)
  Add v6 to eslint version compatibility statement
- ✨ [`a8ca530`](https://github.com/mantoni/eslint_d.js/commit/a8ca5301b3977db97c2f5ea4f69ffcf24d80371f)
  Bump eslint-utils from 1.3.1 to 1.4.2 (dependabot[bot])
    >
    > Bumps [eslint-utils](https://github.com/mysticatea/eslint-utils) from 1.3.1 to 1.4.2.
    > - [Release notes](https://github.com/mysticatea/eslint-utils/releases)
    > - [Commits](https://github.com/mysticatea/eslint-utils/compare/v1.3.1...v1.4.2)
    >
    > Signed-off-by: dependabot[bot] <support@github.com>
- ✨ [`ac8378b`](https://github.com/mantoni/eslint_d.js/commit/ac8378b44ae9b6059a297e9b2446041e57dbf298)
  Upgrade mocha to v6
- ✨ [`b922130`](https://github.com/mantoni/eslint_d.js/commit/b92213051d183137990b9774dcb2ce97a0b2323f)
  Bump lodash from 4.17.11 to 4.17.14 (dependabot[bot])
    >
    > Bumps [lodash](https://github.com/lodash/lodash) from 4.17.11 to 4.17.14.
    > - [Release notes](https://github.com/lodash/lodash/releases)
    > - [Commits](https://github.com/lodash/lodash/compare/4.17.11...4.17.14)
    >
    > Signed-off-by: dependabot[bot] <support@github.com>

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2020-02-19._

## 8.0.0

### Upgrade default eslint to v6

This release retains compatibility with projects depending on eslint v4 and v5.

- 💥 [`34a1012`](https://github.com/mantoni/eslint_d.js/commit/34a101291305d4263db5ae497159f3cbea006c69)
  Upgrade default eslint to v6
- 💥 [`dca7236`](https://github.com/mantoni/eslint_d.js/commit/dca72360a97a7e19825172d4bb55fc85da806ffa)
  Drop Node 6 support, add Node 12 to test config
- 📚 [`44e7bb1`](https://github.com/mantoni/eslint_d.js/commit/44e7bb132255689ad87ad0e3489d42072c664cf4)
  v8 compatibility
- 🐛 [`f72bea2`](https://github.com/mantoni/eslint_d.js/commit/f72bea2540356e59a87d7c5584d4e6ff3126c07c)
  Bump js-yaml from 3.12.0 to 3.13.1 in /test/fixture/v5.0.x (dependabot[bot])
    >
    > Bumps [js-yaml](https://github.com/nodeca/js-yaml) from 3.12.0 to 3.13.1.
    > - [Release notes](https://github.com/nodeca/js-yaml/releases)
    > - [Changelog](https://github.com/nodeca/js-yaml/blob/master/CHANGELOG.md)
    > - [Commits](https://github.com/nodeca/js-yaml/compare/3.12.0...3.13.1)
    >
    > Signed-off-by: dependabot[bot] <support@github.com>
- 🐛 [`d1370e2`](https://github.com/mantoni/eslint_d.js/commit/d1370e2792c1f359c963c8d648c81ae34e10f972)
  Bump js-yaml from 3.12.0 to 3.13.1 in /test/fixture/v4.0.x (dependabot[bot])
    >
    > Bumps [js-yaml](https://github.com/nodeca/js-yaml) from 3.12.0 to 3.13.1.
    > - [Release notes](https://github.com/nodeca/js-yaml/releases)
    > - [Changelog](https://github.com/nodeca/js-yaml/blob/master/CHANGELOG.md)
    > - [Commits](https://github.com/nodeca/js-yaml/compare/3.12.0...3.13.1)
    >
    > Signed-off-by: dependabot[bot] <support@github.com>
- 🐛 [`2e8b375`](https://github.com/mantoni/eslint_d.js/commit/2e8b375cdf45f7787d7b0e4fed0ec10dc0c37da7)
  Bump js-yaml from 3.12.1 to 3.13.1 (dependabot[bot])
    >
    > Bumps [js-yaml](https://github.com/nodeca/js-yaml) from 3.12.1 to 3.13.1.
    > - [Release notes](https://github.com/nodeca/js-yaml/releases)
    > - [Changelog](https://github.com/nodeca/js-yaml/blob/master/CHANGELOG.md)
    > - [Commits](https://github.com/nodeca/js-yaml/compare/3.12.1...3.13.1)
- 🐛 [`72de52e`](https://github.com/mantoni/eslint_d.js/commit/72de52eed694ce25cc6bfd13f6be6a2e01a5d392)
  Move `supports-color` dependency to `core_d`

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2019-06-24._

## 7.3.0

### Extract core\_d, a library for offloading work to a background server

With this release, most of the code from this project was moved to
[core_d](https://github.com/mantoni/core_d.js). This allows you to build your
own projects using the same technique as `eslint_d` for Standard, Prettier and
other tools.

- 🍏 [`786d439`](https://github.com/mantoni/eslint_d.js/commit/786d4397128c340a6f5cf4ab300ac246ad802921)
  Extract `core_d`
- 📚 [`a1501ec`](https://github.com/mantoni/eslint_d.js/commit/a1501ec0645c7faa54be1e824b62ff6e0ada14fa)
  Link to `core_d` in the docs
- 🐛 [`48a95f5`](https://github.com/mantoni/eslint_d.js/commit/48a95f5e24c90d13819a82c51f2d84c62d2be779)
  Reinstall dependencies
- 🐛 [`1bf34a7`](https://github.com/mantoni/eslint_d.js/commit/1bf34a762069ca2a7e71de40924460a4fd814d8d)
  Remove superfluous `sinon.restore()` calls
- ✨ [`8f64205`](https://github.com/mantoni/eslint_d.js/commit/8f64205fe7578540cbf4ebec59075ad1aa2f0db8)
  Use mocha-referee-sinon to verify all tests have assertions
- ✨ [`ec24293`](https://github.com/mantoni/eslint_d.js/commit/ec24293f99f5f9e3dd37cc1e984e664c2bfd67ef)
  Use @sinonjs/referee-sinon v5

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2019-02-26._

## 7.2.0

### Support for multiple major eslint versions

Now you can have multiple projects with a mix of `eslint` 4.0+ and 5.0+
dependencies. The test suite of `eslint_d` has been enhanced to run tests
against all supported major versions.

- 🍏 [`f00a097`](https://github.com/mantoni/eslint_d.js/commit/f00a097b96ca43df25faea8f3980b035a2ddcf7c)
  Change eslint dependency version to `^4 || ^5`
- 🍏 [`25dddb0`](https://github.com/mantoni/eslint_d.js/commit/25dddb05ee49b27509debfc9867191a1d25135a3)
  Run tests against eslint v4.0 and v5.0
- 🐛 [`91aa059`](https://github.com/mantoni/eslint_d.js/commit/91aa0592b6e5fb6fbef4cb6763edb6b1d4ceb270)
  Update npm in Travis Node 6 build
- 📚 [`3491f4f`](https://github.com/mantoni/eslint_d.js/commit/3491f4f1cb714b4e0ffd6689f34e60525aa877cc)
  Add a note about eslint version compatibility

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2018-12-04._

## 7.1.1

### Transparent relaunch on connection failure

If the daemon process was killed or crashed and an orphaned `~/.eslint_d` file
was present, the `eslint_d` command would repeatedly fail to connect. With this
patch, the `~/.eslint_d` file is removed on `ECONNREFUSED` errors and a new
instance is created transparently.

- 🐛 [`ec25134`](https://github.com/mantoni/eslint_d.js/commit/ec251343992477663ad2d7a153168dc1429ba0fe)
  Transparent relaunch on connection failure
- 🐛 [`4abea7c`](https://github.com/mantoni/eslint_d.js/commit/4abea7c0df00083f83aca8fe7874d482b61fcb52)
  Do not retry on connection failure
- 📚 [`6eaf262`](https://github.com/mantoni/eslint_d.js/commit/6eaf26268f9681e81155306a5c459c2aa2776e3d)
  Fix list formatting in changelog
- 📚 [`2fb112b`](https://github.com/mantoni/eslint_d.js/commit/2fb112bca2649c84e5fd4ad15651d55c0aa99e86)
  Fix changelog formatting
- 📚 [`436b45f`](https://github.com/mantoni/eslint_d.js/commit/436b45f5a6564b28c973dc3eb04a0223b93ad8c4)
  Update Studio Changes for `--footer` support

_Released by [Maximilian Antoni](https://github.com/mantoni) on 2018-09-18._

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
    >
    > Chalk is required relative to eslint, so the direct dependency is not
    > being used.
    >
- [`745e013`](https://github.com/mantoni/eslint_d.js/commit/745e013387beaf08dd0a98ab1cf84ed028aed329)
  Add commit hashes in changelog

## 6.0.0

- Upgrade to eslint 5 (Aaron Jensen)

## 5.3.1

- Fix vulnerabilities by updating eslint

## 5.3.0

- Use nanolru to limit the number of cached instances
    >
    > This also enhances the status command to show the number of cached
    > instances.
    >
- Document cache eviction and link to nanolru

## 5.2.2

- Connect to 127.0.0.1 instead of localhost (#84) (Joseph Frazier)
    >
    > If `localhost` doesn't resolve to `127.0.0.1`, the client cannot connect
    > to the server. This issue arose in
    > https://github.com/josephfrazier/prettier_d/pull/7, and I ported the
    > changes from there.
    >

## 5.2.1

- fix(launcher): passthrough environment variables (#81) (Huáng Jùnliàng)

## 5.2.0

- Force all open connections to close when the server is stopped (#79) (Aaron Jensen)
    >
    > This is a less graceful approach to stopping the server, but it allows for
    > editors to hold a connection open to make for an even faster response time.
    >

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
