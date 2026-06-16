---
name: bump-version-on-push
description: >-
  Checks and bumps the Lizard Music app version in package.json before git push.
  Use when pushing code, preparing releases, or when the user mentions version bumps,
  pre-push hooks, or deploying updates.
---

# Bump Version on Push

## Overview

Version source of truth is `package.json`. Vite injects it at build time as `VITE_APP_VERSION` (see `vite.config.js` → `src/version.js` → UI/PWA update flow).

Before every `git push`, automation bumps the version when local matches `origin/main`, then requires a commit before the push proceeds.

## Automation (already configured)

| Layer | File | Trigger |
|-------|------|---------|
| Cursor hook | `.cursor/hooks/bump-version-on-push.sh` | Agent or user runs `git push` in Cursor |
| Git hook | `.githooks/pre-push` | Any `git push` when hooks path is enabled |
| Script | `scripts/bump-version.mjs` | Shared bump logic |

### Enable git hooks (one-time per clone)

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-push .cursor/hooks/bump-version-on-push.sh
```

## Bump rules

- Compare local `package.json` version to `origin/main`.
- If they match, bump the prerelease build: `1.0.0-alpha` → `1.0.0-alpha.1`, `1.0.0-alpha.1` → `1.0.0-alpha.2`.
- Stable versions bump patch: `1.0.0` → `1.0.1`.
- Sync `package-lock.json` top-level `version` and `packages[""].version`.
- If local is already ahead of remote, skip (version was committed for this release).

## Push workflow

When a push is blocked by the version hook:

1. Run `node scripts/bump-version.mjs` if not already bumped.
2. Commit both files:

```bash
git add package.json package-lock.json
git commit -m "chore: bump version to $(node -p "require('./package.json').version")"
```

3. Retry `git push`.

## Manual commands

```bash
# Preview whether a bump is needed (no file writes)
node scripts/bump-version.mjs --check

# Bump and write files
node scripts/bump-version.mjs
```

## Agent checklist on push

- [ ] If push is denied for version bump, commit `package.json` + `package-lock.json` before retrying
- [ ] Do not edit `src/version.js` manually — it reads from build-time env
- [ ] After bumping, update tests that hardcode version strings to use `APP_VERSION` from `src/version.js`
