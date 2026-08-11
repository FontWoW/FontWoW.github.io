import { isNative } from './native'
import { APP_VERSION } from './updates'

const LATEST_RELEASE_API = 'https://api.github.com/repos/FontWoW/FontWoW.github.io/releases/tags/latest'
const DISMISSED_KEY = 'fontwow_update_dismissed_version_v1'

// The Android release workflow writes the version as the first line of the
// GitHub release body, e.g. "version: 1.3.0", since every release reuses the
// same "latest" tag and has no versioned tag_name to read instead.
function parseVersion(body) {
  const match = /version:\s*([0-9]+\.[0-9]+\.[0-9]+)/i.exec(body || '')
  return match ? match[1] : null
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

/**
 * Checks GitHub for a newer Android release than the one currently installed.
 * Returns null when there's nothing to show (up to date, already dismissed,
 * or not running as the native app).
 */
export async function checkForUpdate({ force = false } = {}) {
  if (!isNative()) return null

  let data
  try {
    const res = await fetch(LATEST_RELEASE_API)
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }

  const remoteVersion = parseVersion(data.body)
  if (!remoteVersion || !isNewer(remoteVersion, APP_VERSION)) return null

  if (!force && localStorage.getItem(DISMISSED_KEY) === remoteVersion) return null

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
  localStorage.setItem(DISMISSED_KEY, version)
}
