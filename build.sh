#!/usr/bin/env bash
command="parcel watch src/manifest.json --no-hmr"
log="prog.log"
match="Built"

$command > "$log" &
pid=$!

while sleep 1
do
    if fgrep --quiet "$match" "$log"
    then
        kill -9 $pid
        exit 0
    fi
done