import logger from './logger'
logger.init()

import { Component, StrictMode, useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App.jsx'
import Landing from './Landing.jsx'
import ShareKit from './ShareKit.jsx'
import StartupLoader from './StartupLoader.jsx'
import StatsDashboard from './StatsDashboard.jsx'
import { trackPageView } from './analytics.js'
import { copyTextNative } from './native.js'
import './index.css'

const CHUNK_RELOAD_KEY = 'fontwow_chunk_reload'

async function copyToClipboard(text) {
  if (Capacitor.isNativePlatform()) {
    await copyTextNative(text)
    return
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('Clipboard API unavailable')
}

class StartupErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, details: '', copied: false }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    logger.error('Startup', error?.message || 'Application failed to load', info?.componentStack || '')
    this.setState({
      details: [error?.stack || error?.message, info?.componentStack].filter(Boolean).join('\n\n'),
    })
  }

  copyError = async () => {
    const text = this.state.details || this.state.error?.message || 'Unknown startup error'
    try {
      await copyToClipboard(text)
      this.setState({ copied: true })
    } catch (error) {
      logger.error('Startup', 'Could not copy startup error', error?.message || String(error))
      this.setState({ copied: false })
    }
  }

  retry = () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="startup-error" role="alert" dir="rtl">
        <div className="startup-error__card">
          <div className="startup-error__icon" aria-hidden="true">!</div>
          <h1>بارگذاری فونت‌واو کامل نشد</h1>
          <p>اتصال اینترنت را بررسی کنید و دوباره تلاش کنید. طرح‌های ذخیره‌شده شما حذف نمی‌شوند.</p>
          <button type="button" onClick={this.retry}>تلاش دوباره</button>
          <details>
            <summary>جزئیات خطا</summary>
            <button
              type="button"
              className="startup-error__details-copy"
              onClick={this.copyError}
              aria-label="کپی جزئیات خطا"
              title="برای کپی‌کردن جزئیات خطا کلیک کنید"
            >
              <code dir="ltr">{this.state.details || this.state.error?.message || 'Unknown startup error'}</code>
            </button>
            <span className="startup-error__copy-status" aria-live="polite">
              {this.state.copied ? 'جزئیات خطا کپی شد' : 'برای کپی، روی متن خطا بزنید'}
            </span>
          </details>
        </div>
      </main>
    )
  }
}

window.addEventListener('vite:preloadError', (event) => {
  if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    event.preventDefault()
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
    window.location.reload()
  }
})

function getRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  if (hash === 'app') return 'app'
  if (hash === 'share') return 'share'
  if (hash === 'stats') return 'stats'
  return 'landing'
}

// The native app has no landing page to show — always boot straight into the editor.
if (Capacitor.isNativePlatform() && getRoute() !== 'app') {
  window.location.hash = '#/app'
}

function Root() {
  const [route, setRoute] = useState(getRoute)
  const [isStarting, setIsStarting] = useState(true)
  const trackedRoute = useRef(null)
  const finishStartup = useCallback(() => setIsStarting(false), [])

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('landing-mode', route === 'landing')
  }, [route])

  useEffect(() => {
    if (trackedRoute.current === route) return
    trackedRoute.current = route
    trackPageView(route)
  }, [route])

  return (
    <>
      <div className="startup-content" aria-hidden={isStarting || undefined}>
        {route === 'share' && <ShareKit />}
        {route === 'app' && <App />}
        {route === 'stats' && <StatsDashboard />}
        {route === 'landing' && <Landing />}
      </div>
      {isStarting && <StartupLoader onComplete={finishStartup} />}
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StartupErrorBoundary>
      <Root />
    </StartupErrorBoundary>
  </StrictMode>,
)

// The native bundle already lives on-device. On the web, keep the application
// shell and every font fetched through the app available for later offline use.
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Fire-and-forget: ask the worker to fetch and store every Persian font
      // in the background, well after first paint, so the editor works fully
      // offline without slowing down the initial load. Skipped while offline
      // and retried once connectivity returns.
      const cachePersianFonts = () => {
        if (!navigator.onLine) return
        const target = navigator.serviceWorker.controller || registration.active
        target?.postMessage('CACHE_PERSIAN_FONTS')
      }
      cachePersianFonts()
      window.addEventListener('online', cachePersianFonts)
    }).catch((error) => {
      logger.warn('Offline', 'Service worker registration failed', error?.message || String(error))
    })
  })
}
