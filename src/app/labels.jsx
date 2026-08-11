/* oxlint-disable react/only-export-components */

const starburstPoints = Array.from({ length: 24 }, (_, index) => {
  const angle = (-90 + index * 15) * (Math.PI / 180)
  const radius = index % 2 === 0 ? 145 : 118
  return `${150 + Math.cos(angle) * radius},${150 + Math.sin(angle) * radius}`
}).join(' ')

export const LABEL_ASSETS = [
  { id: 'price-tag', labelKey: 'labelPriceTag', width: 190, aspectRatio: '16 / 9' },
  { id: 'starburst', labelKey: 'labelStarburst', width: 150, aspectRatio: '1' },
  { id: 'ribbon', labelKey: 'labelRibbon', width: 210, aspectRatio: '16 / 9' },
  { id: 'pill', labelKey: 'labelPill', width: 220, aspectRatio: '16 / 7' },
  { id: 'ticket', labelKey: 'labelTicket', width: 210, aspectRatio: '16 / 8' },
  { id: 'circle', labelKey: 'labelCircle', width: 150, aspectRatio: '1' },
  { id: 'banner', labelKey: 'labelBanner', width: 220, aspectRatio: '16 / 7' },
  { id: 'speech', labelKey: 'labelSpeech', width: 210, aspectRatio: '16 / 9' },
  { id: 'flag', labelKey: 'labelFlag', width: 200, aspectRatio: '16 / 9' },
]

export function LabelArtwork({ templateId, color = '#8b5cf6' }) {
  const common = { fill: color, stroke: 'rgba(255,255,255,.9)', strokeWidth: 6 }

  if (templateId === 'starburst') {
    return (
      <svg viewBox="0 0 300 300" aria-hidden="true">
        <polygon points={starburstPoints} {...common} />
        <polygon points={starburstPoints} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="14" />
        <ellipse cx="128" cy="92" rx="58" ry="25" fill="rgba(255,255,255,.22)" transform="rotate(-28 128 92)" />
      </svg>
    )
  }

  if (templateId === 'ribbon') {
    return (
      <svg viewBox="0 0 320 180" aria-hidden="true">
        <path d="M30 34h258l-42 56 42 56H30l22-56z" {...common} strokeLinejoin="round" />
        <path d="M30 34 52 90 30 146V34z" fill="rgba(0,0,0,.2)" />
        <path d="M58 49h190" stroke="rgba(255,255,255,.28)" strokeWidth="12" strokeLinecap="round" />
      </svg>
    )
  }

  if (templateId === 'pill') {
    return <svg viewBox="0 0 320 140" aria-hidden="true"><rect x="10" y="10" width="300" height="120" rx="60" {...common} /><path d="M72 35h158" stroke="rgba(255,255,255,.27)" strokeWidth="15" strokeLinecap="round" /></svg>
  }

  if (templateId === 'ticket') {
    return <svg viewBox="0 0 320 160" aria-hidden="true"><path d="M20 20h280v37c-24 0-24 46 0 46v37H20v-37c24 0 24-46 0-46V20z" {...common} strokeLinejoin="round" /><path d="M96 31v98" stroke="rgba(255,255,255,.48)" strokeWidth="4" strokeDasharray="9 8" /><path d="M130 47h112" stroke="rgba(255,255,255,.25)" strokeWidth="13" strokeLinecap="round" /></svg>
  }

  if (templateId === 'circle') {
    return <svg viewBox="0 0 300 300" aria-hidden="true"><circle cx="150" cy="150" r="132" {...common} /><circle cx="150" cy="150" r="108" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="7" /><ellipse cx="125" cy="95" rx="56" ry="24" fill="rgba(255,255,255,.19)" transform="rotate(-28 125 95)" /></svg>
  }

  if (templateId === 'banner') {
    return <svg viewBox="0 0 320 140" aria-hidden="true"><path d="M12 24h296v92H12l28-46z" {...common} strokeLinejoin="round" /><path d="M42 45h190" stroke="rgba(255,255,255,.28)" strokeWidth="13" strokeLinecap="round" /></svg>
  }

  if (templateId === 'speech') {
    return <svg viewBox="0 0 320 180" aria-hidden="true"><path d="M32 20h256a18 18 0 0 1 18 18v82a18 18 0 0 1-18 18H154l-48 30 10-30H32a18 18 0 0 1-18-18V38a18 18 0 0 1 18-18z" {...common} strokeLinejoin="round" /><path d="M74 53h154" stroke="rgba(255,255,255,.28)" strokeWidth="14" strokeLinecap="round" /></svg>
  }

  if (templateId === 'flag') {
    return <svg viewBox="0 0 320 180" aria-hidden="true"><path d="M30 18h238l-28 72 28 72H30z" {...common} strokeLinejoin="round" /><path d="M62 49h140" stroke="rgba(255,255,255,.28)" strokeWidth="13" strokeLinecap="round" /></svg>
  }

  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <path d="M38 28h210l48 62-48 62H38L8 90z" {...common} strokeLinejoin="round" />
      <circle cx="48" cy="90" r="13" fill="var(--label-hole, #0b0a12)" stroke="rgba(255,255,255,.8)" strokeWidth="6" />
      <path d="M82 46h120" stroke="rgba(255,255,255,.3)" strokeWidth="13" strokeLinecap="round" />
    </svg>
  )
}
