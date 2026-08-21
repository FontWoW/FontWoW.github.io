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

// Every Persian (fa) font's Google Fonts stylesheet, kept in sync with the
// `fa` entries in src/fonts.js. Fetched in the background after the app has
// loaded so the whole Persian font set works offline without slowing down
// the first paint.
const PERSIAN_GOOGLE_FONT_STYLESHEETS = [
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Estedad:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Parastoo:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Lalezar:wght@400&display=swap',
  'https://fonts.googleapis.com/css2?family=Rubik+Arabic:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Katibeh:wght@400&display=swap',
  'https://fonts.googleapis.com/css2?family=Jomhuria:wght@400&display=swap',
  'https://fonts.googleapis.com/css2?family=Mirza:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Lemonada:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Harmattan:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Oi:wght@400&display=swap',
]

// Persian fonts hosted outside Google Fonts (see src/index.css @font-face rules).
const PERSIAN_CDN_FONT_URLS = [
  'https://cdn.jsdelivr.net/gh/MohamadDarvishi/Arad@main/Fonts/Main_Fonts/AradVF.woff2',
  'https://cdn.jsdelivr.net/gh/MohamadDarvishi/Ario@main/Fonts/Main_Fonts/Ario-Dots1.ttf',
  'https://cdn.jsdelivr.net/gh/MohamadDarvishi/Sorena@main/Fonts/Main_Fonts/Sorena-Normal.woff2',
]

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

async function cacheFontStylesheet(url) {
  const cache = await caches.open(FONT_CACHE)
  const alreadyCached = await cache.match(url)
  if (alreadyCached) return
  const response = await fetch(url)
  if (!response.ok) return
  await cache.put(url, response.clone())
  const css = await response.text()
  const fontUrls = css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) || []
  await Promise.all(fontUrls.map(function (fontUrl) {
    return cache.match(fontUrl).then(function (existing) {
      if (existing) return
      return fetch(fontUrl).then(function (fontResponse) {
        if (fontResponse.ok || fontResponse.type === 'opaque') {
          return cache.put(fontUrl, fontResponse)
        }
      }).catch(function () {})
    })
  }))
}

async function cacheCdnFont(url) {
  const cache = await caches.open(FONT_CACHE)
  const alreadyCached = await cache.match(url)
  if (alreadyCached) return
  try {
    const response = await fetch(url)
    if (response.ok || response.type === 'opaque') await cache.put(url, response.clone())
  } catch {
    // Best effort: skip fonts that fail to fetch, e.g. while offline.
  }
}

async function cacheUiFont() {
  return cacheFontStylesheet(UI_FONT_STYLESHEET)
}

// Downloads and stores every Persian font so the app keeps working fully
// offline once this has completed. Run after the app shell is up, never on
// the critical first-load path.
async function cachePersianFonts() {
  for (const url of PERSIAN_GOOGLE_FONT_STYLESHEETS) {
    await cacheFontStylesheet(url).catch(function () {})
  }
  for (const url of PERSIAN_CDN_FONT_URLS) {
    await cacheCdnFont(url)
  }
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

self.addEventListener('message', function (event) {
  if (event.data === 'CACHE_PERSIAN_FONTS') {
    event.waitUntil(cachePersianFonts())
  }
})

async function cacheFirst(request, cacheName) {
  const precached = await caches.match(request)
  if (precached) return precached
  const cache = await caches.open(cacheName)
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') await cache.put(request, response.clone())
  return response
}

// Cache-first with a background revalidation: serves the cached shell
// instantly (so the app opens fast with no network, and offline never has to
// wait on a doomed request to time out), then quietly refreshes the cache
// from the network for next time.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  const network = fetch(request).then(function (response) {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(function () {
    return null
  })
  if (cached) {
    network.catch(function () {})
    return cached
  }
  return (await network) || (await caches.match('/')) || Response.error()
}

self.addEventListener('fetch', function (event) {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(cacheFirst(request, FONT_CACHE))
    return
  }
  if (url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request))
    return
  }
  if (url.pathname.endsWith('.json')) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }
  event.respondWith(cacheFirst(request, RUNTIME_CACHE))
})
