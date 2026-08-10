import { useEffect, useState } from 'react'
import { STRINGS } from './strings.js'

const BOLT = 'M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z'

function getLoadingCopy() {
  try {
    const settings = JSON.parse(localStorage.getItem('fontwow_app_settings_v1') || '{}')
    if (settings.lang === 'en') return { label: STRINGS.en.startupLoading, dir: 'ltr' }
  } catch {
    // Corrupt settings are handled by the application; the loader keeps a safe default.
  }

  return { label: STRINGS.fa.startupLoading, dir: 'rtl' }
}

export default function StartupLoader({ onComplete }) {
  const [leaving, setLeaving] = useState(false)
  const copy = getLoadingCopy()

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), 1500)
    const completeTimer = window.setTimeout(onComplete, 2020)
    return () => {
      window.clearTimeout(leaveTimer)
      window.clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div
      className={`startup-loader${leaving ? ' startup-loader--leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={copy.label}
    >
      <div className="startup-loader__noise" aria-hidden="true" />
      <div className="startup-loader__orb startup-loader__orb--violet" aria-hidden="true" />
      <div className="startup-loader__orb startup-loader__orb--blue" aria-hidden="true" />

      <div className="startup-loader__stage">
        <div className="startup-loader__mark" aria-hidden="true">
          <span className="startup-loader__orbit startup-loader__orbit--outer" />
          <span className="startup-loader__orbit startup-loader__orbit--inner" />
          <span className="startup-loader__spark" />
          <svg viewBox="-8 -8 64 62" className="startup-loader__logo">
            <defs>
              <linearGradient id="startup-bolt-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#d8c6ff" />
                <stop offset=".46" stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#47bfff" />
              </linearGradient>
            </defs>
            <path d={BOLT} pathLength="100" />
          </svg>
        </div>

        <div className="startup-loader__wordmark" aria-hidden="true">
          <span>Font</span><strong>WoW</strong>
        </div>
        <p className="startup-loader__label" dir={copy.dir}>{copy.label}</p>
        <div className="startup-loader__progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  )
}
