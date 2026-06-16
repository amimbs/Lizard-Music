#!/usr/bin/env bash
# Cursor hook: bump app version before git push.
set -euo pipefail

input=$(cat)
command=$(node -e "const d=JSON.parse(process.argv[1]); process.stdout.write(d.command||'')" "$input")

if [[ ! "$command" =~ ^git[[:space:]]+push ]]; then
  echo '{ "permission": "allow" }'
  exit 0
fi

if [[ "$command" =~ (--dry-run|--dryrun|-n[[:space:]]|-n$) ]]; then
  echo '{ "permission": "allow" }'
  exit 0
fi

if node scripts/bump-version.mjs; then
  echo '{ "permission": "allow" }'
  exit 0
fi

echo '{
  "permission": "deny",
  "user_message": "App version was bumped in package.json. Commit package.json and package-lock.json, then push again.",
  "agent_message": "Version bump required before push. Stage and commit package.json and package-lock.json with a message like \"chore: bump version to X.Y.Z\", then retry git push."
}'
exit 2
