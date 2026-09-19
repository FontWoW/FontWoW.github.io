import { Capacitor } from '@capacitor/core'

const COUNTER_ID = 'c01222e5-9a4d-47e9-b07a-9aa20bb5c6bd'
const COUNTER_ENDPOINT = 'https://t.counter.dev/trackpage'

const ROUTE_PAGES = {
  landing: '/',
  app: '/app',
  share: '/share',
  stats: '/stats',
}

function isTrackingDisabled() {
  const sessionOptOut = (() => {
    try { return sessionStorage.getItem('doNotTrack') } catch { return null }
  })()
  const localOptOut = (() => {
    try { return localStorage.getItem('doNotTrack') } catch { return null }
  })()

  return sessionOptOut
    || localOptOut
    || navigator.doNotTrack === '1'
    || navigator.globalPrivacyControl === true
}

export function trackPageView(route) {
  const page = Capacitor.isNativePlatform()
    ? '/native-app'
    : ROUTE_PAGES[route] || ROUTE_PAGES.landing
  trackPage(page)
}

function trackPage(page) {
  if (isTrackingDisabled()) return false

  const payload = new URLSearchParams({ id: COUNTER_ID, page })

  if (navigator.sendBeacon?.(COUNTER_ENDPOINT, payload)) return true

  fetch(COUNTER_ENDPOINT, {
    method: 'POST',
    body: payload,
    keepalive: true,
  }).catch(() => {})
  return true
}

// Only the built-in font id is sent. Text, designs, uploaded fonts and user
// identifiers never leave the device; the existing do-not-track preference
// applies to these signals as well.
export function trackFontUsage(fontId) {
  if (typeof fontId !== 'string' || !/^[a-z0-9-]+$/.test(fontId)) return
  if (fontId.startsWith('gfont-') || fontId.startsWith('custom-')) return
  trackPage(`/font/${fontId}`)
}

export function trackFontLike(fontId) {
  if (typeof fontId !== 'string' || !/^[a-z0-9-]+$/.test(fontId)) return false
  return trackPage(`/font-like/${fontId}`)
}
