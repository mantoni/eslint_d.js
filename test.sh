#!/usr/bin/env bash
set -euo pipefail # bash "strict mode"

eslint=./bin/eslint.js
file=./test/prettier.js

$eslint stop
$eslint start

PORT=`cat ~/.eslint_d | cut -d" " -f1`
TOKEN=`cat ~/.eslint_d | cut -d" " -f2`

md5sum $file | grep 904306b7a51e4f634016cccea8924ea1 >/dev/null
$eslint --fix-to-stdout --stdin < $file | md5sum | grep f75b2b44fd861a20b69f9a3e1960e419 >/dev/null
