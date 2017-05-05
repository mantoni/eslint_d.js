#! /usr/bin/env bash

join_by() { local IFS="$1"; shift; echo "$*"; }

files_array=()   # the buffer array for the files
options_array=() # the buffer array for the parameters
eoo=0            # end of options reached

# naive arguments parsing
while [[ $1 ]]
do
  if ! ((eoo)); then
    case "$1" in
      --) eoo=1                                                         ;;
      -*) options_array+=("$1")                                         ;;
      *)  [ ! -e "$1" ] && options_array+=("$1") || files_array+=("$1") ;;
    esac
  else
    [ -e "$1" ] && files_array+=("$1")
  fi
  shift
done

files=$(join_by ' ' "${files_array[@]}")
options=$(join_by ' ' "${options_array[@]}")
args=$(join_by ' ' "$options" "$files")

if [[ -x "$(command -v nc)" ]] && [[ $files ]]; then
  [[ ! -f ~/.eslint_d ]] && eslint_d_server start

  PORT=$(cut -d " " -f 1 ~/.eslint_d)
  TOKEN=$(cut -d " " -f 2 ~/.eslint_d)
  echo "$TOKEN $PWD $args" | nc localhost "$PORT"
else
  eval "eslint_d_server $args"
fi
