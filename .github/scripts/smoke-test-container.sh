#!/usr/bin/env bash
# Usage: smoke-test-container.sh <image> <expected-exit-code> <path>...
# Polls the first path until the app is up, then requires every path (and the
# assets each HTML page loads) to succeed, then stops the container with
# SIGTERM and asserts it exits promptly with <expected-exit-code>.
set -euo pipefail

image=$1
expected_code=$2
shift 2
paths=("$@")
name=smoke-$$
base=http://localhost:8080

trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT

fail() {
  echo "::error::$1"
  docker logs "$name" || true
  exit 1
}

docker run -d --name "$name" -p 8080:8080 "$image" >/dev/null

deadline=$((SECONDS + 30))
until curl -fs -o /dev/null --max-time 2 "$base${paths[0]}"; do
  [ "$(docker inspect -f '{{.State.Running}}' "$name")" = true ] ||
    fail "Container exited during startup"
  [ "$SECONDS" -lt "$deadline" ] || fail "GET ${paths[0]} did not succeed within 30s"
  sleep 1
done

for path in "${paths[@]}"; do
  body=$(curl -fsg --max-time 5 "$base$path") || fail "GET $path failed"
  # A page can return 200 while the scripts, styles or images it loads are
  # missing from the image. Only resources are followed (any same-origin
  # src, plus stylesheet hrefs under /_next/static), never page links.
  { grep -oE '(src="/[^/"][^"]*"|href="/_next/static/[^"]*")' <<<"$body" || true; } |
    cut -d'"' -f2 | sed 's/&amp;/\&/g' | sort -u |
    while read -r asset; do
      curl -fsg -o /dev/null --max-time 5 "$base$asset" ||
        fail "Asset $asset loaded by $path failed"
    done
done

# Cloud Run sends SIGTERM on scale-down; the app must exit well within the
# grace period rather than being SIGKILLed — even with an idle keep-alive
# connection open, as Cloud Run's front end holds them.
exec 3<>/dev/tcp/127.0.0.1/8080 || fail "Could not open a keep-alive connection"
printf 'GET %s HTTP/1.1\r\nHost: localhost\r\n\r\n' "${paths[0]}" >&3
docker stop -t 5 "$name" >/dev/null || fail "docker stop failed"
exec 3>&-

code=$(docker inspect -f '{{.State.ExitCode}}' "$name")
[ "$code" = "$expected_code" ] ||
  fail "Container exited with $code on SIGTERM (expected $expected_code)"
