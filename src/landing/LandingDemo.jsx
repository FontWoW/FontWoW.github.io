import { useMemo, useState } from 'react'
import { TEXT_GRADIENTS } from '../shared/fonts'
import * as I from '../shared/icons'

const EFFECTS = [
  { id: 'none', label: 'ساده' },
  { id: 'neon', label: 'نئون' },
  { id: 'gradient', label: 'گرادیان' },
]

const PRESETS = [
  { id: 't2', label: 'نئون شب', effect: 'neon', color: '#4dd0e1', bg: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)' },
  { id: 't3', label: 'طلایی', effect: 'gradient', gradient: 'g1', color: '#ffd700', bg: '#111111' },
  { id: 't6', label: 'رنگین‌کمان', effect: 'gradient', gradient: 'g6', color: '#ffffff', bg: '#111111' },
]

export default function LandingDemo() {
  const [text, setText] = useState('فونت واو')
  const [effect, setEffect] = useState('neon')
  const [presetId, setPresetId] = useState('t2')

  const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[0]
  const activeEffect = effect
  const gradientCss = useMemo(() => {
    const id = preset.gradient || 'g3'
    return TEXT_GRADIENTS.find((g) => g.id === id)?.css || TEXT_GRADIENTS[2].css
  }, [preset])

  const textStyle = useMemo(() => {
    if (activeEffect === 'neon') {
      return {
        color: preset.color,
        textShadow: `0 0 8px ${preset.color}, 0 0 22px ${preset.color}, 0 0 40px rgba(77, 208, 225, 0.45)`,
      }
    }
    if (activeEffect === 'gradient') {
      return {
        backgroundImage: gradientCss,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        textShadow: 'none',
      }
    }
    return { color: '#ffffff', textShadow: '0 2px 16px rgba(0,0,0,0.35)' }
  }, [activeEffect, gradientCss, preset.color])

  const openInApp = presetId ? `#/app?template=${presetId}` : '#/app'

  return (
    <section className="landing-demo landing-reveal" aria-label="دموی زنده متن‌آرایی">
      <h2>همین الان امتحان کن</h2>
      <p className="landing-demo-lead">بنویس، افکت بزن، بعد همان سبک را در ادیتور باز کن.</p>

      <div className="landing-demo-stage" style={{ background: preset.bg }}>
        <p className="landing-demo-preview" style={textStyle}>
          {text.trim() || '…'}
        </p>
      </div>

      <label className="landing-demo-field">
        <span>متن</span>
        <input
          type="text"
          value={text}
          maxLength={40}
          onChange={(e) => setText(e.target.value)}
          placeholder="متن خودت را بنویس…"
        />
      </label>

      <div className="landing-demo-row" role="group" aria-label="افکت متن">
        {EFFECTS.map((fx) => (
          <button
            key={fx.id}
            type="button"
            className={`landing-demo-chip${activeEffect === fx.id ? ' selected' : ''}`}
            onClick={() => setEffect(fx.id)}
          >
            {fx.label}
          </button>
        ))}
      </div>

      <div className="landing-demo-row" role="group" aria-label="قالب آماده">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`landing-demo-chip landing-demo-chip-soft${presetId === p.id ? ' selected' : ''}`}
            onClick={() => {
              setPresetId(p.id)
              setEffect(p.effect)
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <a className="landing-btn landing-btn-primary landing-demo-cta" href={openInApp}>
        <I.IconExternal size={16} />
        باز کردن این سبک در ادیتور
      </a>
    </section>
  )
}
