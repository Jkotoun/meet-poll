#!/usr/bin/env bash
# Usage: smoke-test-url.sh <base-url> <path>...
# Waits (up to SMOKE_TIMEOUT seconds, default 60) for the first path to
# succeed, then requires every path — and the resources each HTML page loads —
# to return 2xx.
set -euo pipefail

base=$1
shift
paths=("$@")
deadline=$((SECONDS + ${SMOKE_TIMEOUT:-60}))

# curl -f alone accepts redirects, whose (empty) body would skip the asset
# checks below; only a 2xx counts.
is_2xx() {
  [[ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$1")" == 2* ]]
}

until is_2xx "$base${paths[0]}"; do
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "::error::GET ${paths[0]} did not succeed within ${SMOKE_TIMEOUT:-60}s"
    exit 1
  fi
  sleep 2
done

for path in "${paths[@]}"; do
  is_2xx "$base$path" || {
    echo "::error::GET $path did not return 2xx"
    exit 1
  }
  body=$(curl -fsg --max-time 10 "$base$path")
  # A page can return 200 while the scripts, styles or images it loads are
  # missing. Only resources are followed (any same-origin src, plus stylesheet
  # hrefs under /_next/static), never page links.
  { grep -oE '(src="/[^/"][^"]*"|href="/_next/static/[^"]*")' <<<"$body" || true; } |
    cut -d'"' -f2 | sed 's/&amp;/\&/g' | sort -u |
    while read -r asset; do
      is_2xx "$base$asset" || {
        echo "::error::Asset $asset loaded by $path failed"
        exit 1
      }
    done
done
