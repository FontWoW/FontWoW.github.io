/* oxlint-disable react/only-export-components */

const starburstPoints = Array.from({ length: 24 }, (_, index) => {
  const angle = (-90 + index * 15) * (Math.PI / 180)
  const radius = index % 2 === 0 ? 145 : 118
  return `${150 + Math.cos(angle) * radius},${150 + Math.sin(angle) * radius}`
}).join(' ')

export const LABEL_CATEGORIES = [
  { id: 'all', labelKey: 'lblCatAll' },
  { id: 'sale', labelKey: 'lblCatSale' },
  { id: 'badges', labelKey: 'lblCatBadges' },
  { id: 'shapes', labelKey: 'lblCatShapes' },
]

export const LABEL_ASSETS = [
  { id: 'off-badge', labelKey: 'labelOffBadge', category: 'sale', width: 170, aspectRatio: '1', defaultColor: '#ef4444', defaultText: '50% OFF' },
  { id: 'sale-hot', labelKey: 'labelSaleBadge', category: 'sale', width: 210, aspectRatio: '16 / 8', defaultColor: '#f97316', defaultText: 'حراج داغ 🔥' },
  { id: 'special-offer', labelKey: 'labelSpecialOffer', category: 'sale', width: 220, aspectRatio: '16 / 7', defaultColor: '#ec4899', defaultText: 'پیشنهاد ویژه' },
  { id: 'price-tag', labelKey: 'labelPriceTag', category: 'sale', width: 190, aspectRatio: '16 / 9', defaultColor: '#8b5cf6', defaultText: 'قیمت ویژه' },
  { id: 'starburst', labelKey: 'labelStarburst', category: 'sale', width: 160, aspectRatio: '1', defaultColor: '#e11d48', defaultText: 'تخفیف' },
  { id: 'ticket', labelKey: 'labelTicket', category: 'sale', width: 210, aspectRatio: '16 / 8', defaultColor: '#10b981', defaultText: 'کد تخفیف' },

  { id: 'new-badge', labelKey: 'labelNewBadge', category: 'badges', width: 180, aspectRatio: '16 / 8', defaultColor: '#06b6d4', defaultText: 'NEW جدید' },
  { id: 'verified', labelKey: 'labelVerified', category: 'badges', width: 200, aspectRatio: '16 / 8', defaultColor: '#3b82f6', defaultText: 'ضمانت اصالت' },
  { id: 'story-tag', labelKey: 'labelStoryTag', category: 'badges', width: 210, aspectRatio: '16 / 7', defaultColor: '#d946ef', defaultText: 'استوری ترند' },
  { id: 'swipe-up', labelKey: 'labelSwipeUp', category: 'badges', width: 210, aspectRatio: '16 / 7', defaultColor: '#8b5cf6', defaultText: 'ورق بزنید 👈' },

  { id: 'ribbon', labelKey: 'labelRibbon', category: 'shapes', width: 210, aspectRatio: '16 / 9', defaultColor: '#6366f1', defaultText: 'عنوان روبان' },
  { id: 'pill', labelKey: 'labelPill', category: 'shapes', width: 220, aspectRatio: '16 / 7', defaultColor: '#14b8a6', defaultText: 'برچسب کپسولی' },
  { id: 'circle', labelKey: 'labelCircle', category: 'shapes', width: 160, aspectRatio: '1', defaultColor: '#f59e0b', defaultText: 'نشان گرد' },
  { id: 'banner', labelKey: 'labelBanner', category: 'shapes', width: 220, aspectRatio: '16 / 7', defaultColor: '#84cc16', defaultText: 'بنر فروش' },
  { id: 'speech', labelKey: 'labelSpeech', category: 'shapes', width: 210, aspectRatio: '16 / 9', defaultColor: '#0ea5e9', defaultText: 'پیام مهم' },
  { id: 'flag', labelKey: 'labelFlag', category: 'shapes', width: 200, aspectRatio: '16 / 9', defaultColor: '#a855f7', defaultText: 'اعلان فوری' },
]

export function LabelArtwork({ templateId, color = '#8b5cf6' }) {
  const common = { fill: color, stroke: 'rgba(255,255,255,.9)', strokeWidth: 6 }

  if (templateId === 'off-badge') {
    return (
      <svg viewBox="0 0 300 300" aria-hidden="true">
        <circle cx="150" cy="150" r="134" {...common} />
        <circle cx="150" cy="150" r="116" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="4" strokeDasharray="8 6" />
        <path d="M70 150h160" stroke="rgba(255,255,255,.2)" strokeWidth="18" strokeLinecap="round" />
        <polygon points="150,30 162,56 190,56 167,73 176,100 150,83 124,100 133,73 110,56 138,56" fill="#ffd700" opacity="0.9" />
      </svg>
    )
  }

  if (templateId === 'sale-hot') {
    return (
      <svg viewBox="0 0 320 160" aria-hidden="true">
        <path d="M25 20h270l-20 60 20 60H25l20-60z" {...common} strokeLinejoin="round" />
        <path d="M55 42h210" stroke="rgba(255,255,255,.3)" strokeWidth="10" strokeLinecap="round" />
        <circle cx="65" cy="80" r="12" fill="#ffd700" />
      </svg>
    )
  }

  if (templateId === 'special-offer') {
    return (
      <svg viewBox="0 0 320 140" aria-hidden="true">
        <rect x="12" y="12" width="296" height="116" rx="58" {...common} />
        <rect x="22" y="22" width="276" height="96" rx="48" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="3" strokeDasharray="6 5" />
        <polygon points="46,70 52,58 65,58 55,67 59,79 46,72 34,79 37,67 27,58 40,58" fill="#ffd700" />
        <polygon points="274,70 280,58 293,58 283,67 287,79 274,72 262,79 265,67 255,58 268,58" fill="#ffd700" />
      </svg>
    )
  }

  if (templateId === 'new-badge') {
    return (
      <svg viewBox="0 0 320 160" aria-hidden="true">
        <rect x="18" y="20" width="284" height="120" rx="20" {...common} />
        <path d="M18 60h284" stroke="rgba(255,255,255,.2)" strokeWidth="12" />
        <polygon points="48,34 53,44 64,44 55,51 58,62 48,56 38,62 41,51 32,44 43,44" fill="#ffffff" />
        <polygon points="272,34 277,44 288,44 279,51 282,62 272,56 262,62 265,51 256,44 267,44" fill="#ffffff" />
      </svg>
    )
  }

  if (templateId === 'verified') {
    return (
      <svg viewBox="0 0 320 160" aria-hidden="true">
        <rect x="16" y="20" width="288" height="120" rx="30" {...common} />
        <circle cx="62" cy="80" r="22" fill="rgba(255,255,255,.25)" />
        <path d="M52 80l7 7 14-14" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M102 44h160" stroke="rgba(255,255,255,.3)" strokeWidth="10" strokeLinecap="round" />
      </svg>
    )
  }

  if (templateId === 'story-tag') {
    return (
      <svg viewBox="0 0 320 140" aria-hidden="true">
        <rect x="14" y="14" width="292" height="112" rx="28" {...common} />
        <rect x="22" y="22" width="276" height="96" rx="22" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="3" />
        <circle cx="50" cy="70" r="14" fill="#ffffff" opacity="0.3" />
        <circle cx="50" cy="70" r="7" fill="#ffffff" />
      </svg>
    )
  }

  if (templateId === 'swipe-up') {
    return (
      <svg viewBox="0 0 320 140" aria-hidden="true">
        <rect x="14" y="14" width="292" height="112" rx="56" {...common} />
        <path d="M42 70h236" stroke="rgba(255,255,255,.2)" strokeWidth="12" strokeLinecap="round" />
        <path d="M260 70l-16-12v24z" fill="#ffffff" />
      </svg>
    )
  }

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
