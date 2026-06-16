#!/usr/bin/env node
/**
 * Check and bump the app version before push.
 * Source of truth: package.json (synced to package-lock.json).
 * Vite injects it as VITE_APP_VERSION at build time (see vite.config.js).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const pkgPath = resolve(root, 'package.json')
const lockPath = resolve(root, 'package-lock.json')

const checkOnly = process.argv.includes('--check')

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
}

/** @param {string} version */
function bumpVersion(version) {
  const match = version.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/
  )
  if (!match) {
    throw new Error(`Unsupported version format: ${version}`)
  }

  const [, major, minor, patch, prerelease] = match
  if (!prerelease) {
    return `${major}.${minor}.${Number(patch) + 1}`
  }

  const segments = prerelease.split('.')
  const last = segments[segments.length - 1]
  if (/^\d+$/.test(last)) {
    segments[segments.length - 1] = String(Number(last) + 1)
  } else {
    segments.push('1')
  }
  return `${major}.${minor}.${patch}-${segments.join('.')}`
}

function remoteVersion() {
  try {
    const raw = execSync('git show origin/main:package.json', {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return JSON.parse(raw).version
  } catch {
    return null
  }
}

function versionChangedInHead() {
  try {
    const raw = execSync('git show HEAD:package.json', {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const headVersion = JSON.parse(raw).version
    const pkg = readJson(pkgPath)
    return headVersion !== pkg.version
  } catch {
    return false
  }
}

function syncLockFile(version) {
  const lock = readJson(lockPath)
  lock.version = version
  if (lock.packages?.['']) {
    lock.packages[''].version = version
  }
  writeJson(lockPath, lock)
}

function main() {
  const pkg = readJson(pkgPath)
  const current = pkg.version
  const remote = remoteVersion()

  const needsBump =
    remote === null ? !versionChangedInHead() : current === remote

  if (!needsBump) {
    if (checkOnly) {
      console.log(`Version ${current} is ahead of remote (${remote ?? 'unknown'}).`)
    }
    return 0
  }

  const next = bumpVersion(current)

  if (checkOnly) {
    console.log(`Version bump needed: ${current} -> ${next}`)
    return 1
  }

  pkg.version = next
  writeJson(pkgPath, pkg)
  syncLockFile(next)

  console.log(`Bumped version: ${current} -> ${next}`)
  console.log('Commit package.json and package-lock.json before pushing.')
  return 1
}

process.exit(main())
