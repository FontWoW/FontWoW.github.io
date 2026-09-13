import { isNative } from './native'
import { APP_VERSION } from './updates'

const LATEST_RELEASE_API = 'https://api.github.com/repos/FontWoW/FontWoW.github.io/releases/tags/latest'
const DISMISSED_KEY = 'fontwow_update_dismissed_version_v1'
const LAST_CHECK_KEY = 'fontwow_update_last_check_v1'
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000

// The Android release workflow writes the version in the body, but the GitHub
// release name, tag, or APK asset name can also be used as a fallback so the
// update checker keeps working if one field changes format.
function parseVersion(...candidates) {
  for (const candidate of candidates) {
    const match = /(?:^|[^0-9])([0-9]+\.[0-9]+\.[0-9]+)(?:[^0-9]|$)/.exec(candidate || '')
    if (match) return match[1]
  }
  return null
}

function parseChangesFromBody(body) {
  return (body || '')
    .split('\n')
    .filter((line) => line.trim().startsWith('-'))
    .map((line) => line.trim().replace(/^-\s*/, ''))
}

function isNewer(remote, local) {
  const r = remote.split('.').map(Number)
  const l = local.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) !== (l[i] || 0)) return (r[i] || 0) > (l[i] || 0)
  }
  return false
}

function readDismissedVersion() {
  try {
    return localStorage.getItem(DISMISSED_KEY)
  } catch {
    return null
  }
}

function dismissVersion(version) {
  try {
    localStorage.setItem(DISMISSED_KEY, version)
  } catch {
    // Ignore storage failures so update checks never break in restricted webviews.
  }
}

function readLastCheck() {
  try {
    return Number(localStorage.getItem(LAST_CHECK_KEY)) || 0
  } catch {
    return 0
  }
}

function writeLastCheck(time) {
  try {
    localStorage.setItem(LAST_CHECK_KEY, String(time))
  } catch {
    // Ignore storage failures so update checks never break in restricted webviews.
  }
}

/**
 * Checks GitHub for a newer Android release than the one currently installed.
 * Returns null when there's nothing to show (up to date, already dismissed,
 * not running as the native app, offline, or already checked within the
 * last 24 hours).
 */
export async function checkForUpdate({ force = false } = {}) {
  if (!isNative()) return null
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null

  const now = Date.now()
  if (!force && now - readLastCheck() < CHECK_INTERVAL_MS) return null

  let data
  try {
    writeLastCheck(now)
    const res = await fetch(LATEST_RELEASE_API)
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }

  const remoteVersion = parseVersion(data.body, data.name, data.tag_name, data.assets?.map((a) => a.name).join(' '))
  if (!remoteVersion || !isNewer(remoteVersion, APP_VERSION)) return null

  if (!force && readDismissedVersion() === remoteVersion) return null

  const asset = data.assets
    ?.filter((a) => a.name.endsWith('.apk'))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

  return {
    version: remoteVersion,
    changes: parseChangesFromBody(data.body),
    downloadUrl: asset?.browser_download_url ?? null,
  }
}

export function dismissUpdate(version) {
  dismissVersion(version)
}
