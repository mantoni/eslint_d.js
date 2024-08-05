#!/bin/bash
config="$PWD/node_modules/eslint/.eslint_d"

if [ ! -e $config ]; then
  eslint_d $@ <&0
  exit $?
fi

read token port pid hsh <<< $(<$config)
[ -t 1 ] && color=1 || color=0
args="[\"bash\",\"$(printf %s "${0-}" "${@/#/\",\"}")\"]"

input() {
  echo -n "[\"$token\",$color,\"$PWD\",$args]"
  if [[ $args =~ '"--stdin"' ]]; then
    echo
    echo -n "$(cat)"
  fi
}

output() {
  content=$(cat)
  exit_token=${content: -7}

  if [[ $exit_token =~ ^EXIT([0-9]{3})$ ]]; then
    length=${#content}
    echo -n "${content:0:length-7}"
    return ${BASH_REMATCH[1]}
  else
    echo -n "$content"
    echo >&2 "eslint_d: unexpected response"
    return 1
  fi
}

input | nc 127.0.0.1 $port 2>&1 | output
