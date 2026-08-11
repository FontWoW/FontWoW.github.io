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
  return sessionStorage.getItem('doNotTrack') || localStorage.getItem('doNotTrack')
}

export function trackPageView(route) {
  if (isTrackingDisabled()) return

  const page = Capacitor.isNativePlatform()
    ? '/native-app'
    : ROUTE_PAGES[route] || ROUTE_PAGES.landing
  const payload = new URLSearchParams({ id: COUNTER_ID, page })

  if (navigator.sendBeacon?.(COUNTER_ENDPOINT, payload)) return

  fetch(COUNTER_ENDPOINT, {
    method: 'POST',
    body: payload,
    keepalive: true,
  }).catch(() => {})
}
