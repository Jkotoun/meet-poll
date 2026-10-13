#!/usr/bin/env bash
# Prints the Bun version pinned in package.json's packageManager field, so
# image builds use the same runtime as CI checks and local dev.
set -euo pipefail

pm=$(jq -r '.packageManager // empty' package.json)
if [[ ! "$pm" =~ ^bun@([0-9]+\.[0-9]+\.[0-9]+)$ ]]; then
  echo "::error::packageManager must be bun@X.Y.Z, got '$pm'" >&2
  exit 1
fi
echo "${BASH_REMATCH[1]}"
