#!/usr/bin/env bash
# Usage: changed-apps.sh <region> <app>...
# Prints a JSON array of the apps to deploy. An app is deployed when what
# serves isn't the newest revision (a Terraform template change, or a
# candidate that failed its smoke test, is waiting) or when its image inputs
# differ from the commit it serves. Both checks read live state rather than
# the previous commit, so a dropped or failed deploy is retried on the next
# push.
set -euo pipefail

region=$1
shift

changed=()
for app in "$@"; do
  service=meet-poll-$app
  status=$(gcloud run services describe "$service" --region "$region" --format=json | jq '.status')
  serving=$(jq -r '[.traffic[]? | select(.percent == 100)][0].revisionName // empty' <<<"$status")
  latest=$(jq -r '.latestCreatedRevisionName // empty' <<<"$status")

  if [ -z "$serving" ]; then
    echo "::warning::$service has no revision at 100% traffic; deploying it" >&2
    changed+=("$app")
    continue
  fi
  if [ "$serving" != "$latest" ]; then
    changed+=("$app")
    continue
  fi

  image=$(gcloud run revisions describe "$serving" --region "$region" \
    --format='value(spec.containers[0].image)')
  deployed_sha=${image##*:}

  # Placeholder image from Terraform, or a commit no longer in history.
  if [[ ! "$deployed_sha" =~ ^[0-9a-f]{40}$ ]] || ! git cat-file -e "$deployed_sha^{commit}" 2>/dev/null; then
    changed+=("$app")
    continue
  fi

  # Everything the app's image is built from; keep in sync with the
  # `backend`/`frontend` paths filters in ci.yml. Docs aren't in the image.
  if ! git diff --quiet "$deployed_sha" HEAD -- \
    "apps/$app" apps/*/package.json packages package.json bun.lock turbo.json \
    .dockerignore .github/actions/build-image \
    .github/workflows/deploy.yml ':(exclude)*.md'; then
    changed+=("$app")
  fi
done

if [ "${#changed[@]}" -eq 0 ]; then
  echo '[]'
else
  printf '%s\n' "${changed[@]}" | jq -Rnc '[inputs]'
fi
