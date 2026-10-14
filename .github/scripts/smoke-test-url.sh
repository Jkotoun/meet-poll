#!/usr/bin/env bash
# Usage: smoke-test-url.sh <url>
# Waits up to 60s for the URL to return 2xx.
set -euo pipefail

url=$1
deadline=$((SECONDS + 60))

until [[ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$url")" == 2* ]]; do
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "::error::$url did not return 2xx within 60s"
    exit 1
  fi
  sleep 2
done
