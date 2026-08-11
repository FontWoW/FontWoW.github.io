const SHELL_CACHE = 'fontwow-shell-v1.4.1'
const RUNTIME_CACHE = 'fontwow-runtime-v1'
const FONT_CACHE = 'fontwow-fonts-v1'
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/donations.json',
]
const UI_FONT_STYLESHEET = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;800&display=swap'

async function cacheAppShell() {
  const cache = await caches.open(SHELL_CACHE)
  await cache.addAll(APP_SHELL)

  // Vite gives bundles content hashes. Discover them from the built page so a
  // completed first visit is enough for the next launch to work offline.
  const page = await cache.match('/')
  if (!page) return
  const html = await page.text()
  const urls = []
  const assetPattern = /(?:src|href)=["']([^"']+)["']/g
  let match
  while ((match = assetPattern.exec(html))) {
    const url = new URL(match[1], self.location.origin)
    if (url.origin === self.location.origin) urls.push(url.href)
  }
  await Promise.all(urls.map(function (url) {
    return cache.add(url).catch(function () {})
  }))
}

async function cacheUiFont() {
  const cache = await caches.open(FONT_CACHE)
  const response = await fetch(UI_FONT_STYLESHEET)
  if (!response.ok) return
  await cache.put(UI_FONT_STYLESHEET, response.clone())
  const css = await response.text()
  const fontUrls = css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) || []
  await Promise.all(fontUrls.map(function (url) {
    return fetch(url).then(function (fontResponse) {
      if (fontResponse.ok || fontResponse.type === 'opaque') {
        return cache.put(url, fontResponse)
      }
    }).catch(function () {})
  }))
}

self.addEventListener('install', function (event) {
  event.waitUntil(Promise.all([
    cacheAppShell(),
    cacheUiFont().catch(function () {}),
  ]).then(function () { return self.skipWaiting() }))
})

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (key) {
      if (key.indexOf('fontwow-shell-') === 0 && key !== SHELL_CACHE) {
        return caches.delete(key)
      }
    }))
  }).then(function () { return self.clients.claim() }))
})

async function cacheFirst(request, cacheName) {
  const precached = await caches.match(request)
  if (precached) return precached
  const cache = await caches.open(cacheName)
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') await cache.put(request, response.clone())
  return response
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch {
    return (await cache.match(request)) || (await caches.match('/')) || Response.error()
  }
}

self.addEventListener('fetch', function (event) {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Never cache Vite / HMR / source modules — stale React copies break hooks in DEV
  // if a SW was left registered from a previous visit to the same origin.
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.search.includes('v=') ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1'
  ) {
    return
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, FONT_CACHE))
    return
  }
  if (url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }
  if (url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(request))
    return
  }
  event.respondWith(cacheFirst(request, RUNTIME_CACHE))
})
