/* oxlint-disable react/only-export-components */
/* Hand-rolled stroke icon set (24px grid, Lucide-style) + brand SVGs. No deps. */

function icon(children, viewBox = '0 0 24 24') {
  return function SvgIcon({ size = 18, className, ...props }) {
    return (
      <svg
        viewBox={viewBox}
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    )
  }
}

export const IconX = icon(<path d="M18 6 6 18M6 6l12 12" />)
export const IconLoader = icon(<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />)
export const IconPlus = icon(<path d="M12 5v14M5 12h14" />)
export const IconSettings = icon(
  <>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </>,
)
export const IconDownload = icon(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </>,
)
export const IconArrowUp = icon(<path d="M12 19V5M5 12l7-7 7 7" />)
export const IconArrowDown = icon(<path d="M12 5v14M19 12l-7 7-7-7" />)
export const IconImages = icon(
  <>
    <rect x="7" y="3" width="14" height="14" rx="2" />
    <circle cx="11.5" cy="7.5" r="1.5" />
    <path d="m21 13-2.6-2.6a2 2 0 0 0-2.8 0L9 17" />
    <path d="M17 21H5a2 2 0 0 1-2-2V7" />
  </>,
)
export const IconImage = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
  </>,
)
export const IconHeart = icon(
  <path d="M19.5 13.6 12 21l-7.5-7.4A5.2 5.2 0 1 1 12 6.3a5.2 5.2 0 1 1 7.5 7.3Z" />,
)
export const IconTextSize = icon(
  <>
    <path d="m3 17 3-8 3 8" />
    <path d="M4.1 14.5h3.8" />
    <path d="m12 17 4.5-12L21 17" />
    <path d="M13.7 12.5h5.6" />
  </>,
)
export const IconAlignRight = icon(<path d="M21 6H3M21 12H9M21 18H7" />)
export const IconAlignCenter = icon(<path d="M21 6H3M17 12H7M19 18H5" />)
export const IconAlignLeft = icon(<path d="M21 6H3M15 12H3M17 18H3" />)
export const IconUnderline = icon(
  <>
    <path d="M6 4v6a6 6 0 0 0 12 0V4" />
    <path d="M4 20h16" />
  </>,
)
export const IconTrash = icon(
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6M14 11v6" />
  </>,
)
export const IconRotate = icon(
  <>
    <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.9 1 6.7 2.7L21 8" />
    <path d="M21 3v5h-5" />
  </>,
)
export const IconTag = icon(
  <>
    <path d="M20 13 11 22 2 13V4h9l9 9Z" />
    <circle cx="7" cy="9" r="1" fill="currentColor" stroke="none" />
  </>,
)
export const IconUndo = icon(<path d="M9 14 4 9l5-5M4 9h9a7 7 0 1 1-7 7" />)
export const IconRedo = icon(<path d="m15 14 5-5-5-5m5 5h-9a7 7 0 1 0 7 7" />)
export const IconShadow = icon(
  <>
    <rect x="4" y="4" width="12" height="12" rx="2.5" />
    <path d="M20 9v7a4 4 0 0 1-4 4H9" />
  </>,
)
export const IconCircle = icon(<circle cx="12" cy="12" r="9" />)
export const IconArrowsLR = icon(
  <>
    <path d="m8 3-5 4 5 4" />
    <path d="M3 7h13" />
    <path d="m16 13 5 4-5 4" />
    <path d="M21 17H8" />
  </>,
)
export const IconCopy = icon(
  <>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15c-1.1 0-2-.9-2-2V5a2 2 0 0 1 2-2h8c1.1 0 2 .9 2 2" />
  </>,
)
export const IconType = icon(
  <>
    <path d="M4 7V4h16v3" />
    <path d="M12 4v16" />
    <path d="M9 20h6" />
  </>,
)
export const IconStar = icon(
  <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1-5.4-2.9-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8L12 3z" />,
)
export const IconFork = icon(
  <>
    <circle cx="6" cy="4" r="2" />
    <circle cx="18" cy="4" r="2" />
    <circle cx="12" cy="20" r="2" />
    <path d="M6 6v3a3 3 0 0 0 3 3h3M18 6v3a3 3 0 0 1-3 3h-3v6" />
  </>,
)
export const IconCreditCard = icon(
  <>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </>,
)
export const IconGithub = icon(
  <>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </>,
)
export const IconTelegram = icon(
  <path d="m22 2-7 20-4-9-9-4 20-7ZM11 13l5-5" />,
)
export const IconInstagram = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none" />
  </>,
)
export const IconTwitter = icon(<path d="M18 3h3l-6.6 7.5L22 21h-6l-4.7-6.2L5.8 21H3l7-8L2.7 3h6.2l4.2 5.6L18 3Zm-1 16h1.7L8 4.9H6.2L17 19Z" />)
export const IconLinkedin = icon(
  <>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </>,
)
export const IconGlobe = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
  </>,
)
export const IconTiktok = icon(
  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />,
)
export const IconYoutube = icon(
  <>
    <rect x="2" y="5" width="20" height="14" rx="4" />
    <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
  </>,
)
export const IconMail = icon(
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-9 5.7a2 2 0 0 1-2 0L2 7" />
  </>,
)
export const IconRefresh = icon(
  <>
    <path d="M3 12a9 9 0 1 0 9-9c-2.5 0-4.9 1-6.7 2.7L3 8" />
    <path d="M3 3v5h5" />
  </>,
)
export const IconExternal = icon(
  <>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </>,
)
export const IconSparkles = icon(
  <>
    <path d="M12 3c.7 4 2.3 5.6 6.3 6.3-4 .7-5.6 2.3-6.3 6.3-.7-4-2.3-5.6-6.3-6.3 4-.7 5.6-2.3 6.3-6.3Z" />
    <path d="M19 14.5v4M21 16.5h-4" />
    <path d="M5 4v3M6.5 5.5h-3" />
  </>,
)
export const IconSquare = icon(<rect x="4" y="4" width="16" height="16" rx="3" />)
export const IconPalette = icon(
  <>
    <path d="M12 22a10 10 0 1 1 10-10c0 1.7-1.3 3-3 3h-2.2a2 2 0 0 0-1.5 3.3c.3.4.5.8.5 1.2a2.2 2.2 0 0 1-2.3 2.5Z" />
    <circle cx="7.6" cy="11.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="11" cy="7.3" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15.8" cy="8.8" r="1.3" fill="currentColor" stroke="none" />
  </>,
)
export const IconSliders = icon(
  <>
    <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3" />
    <path d="M14 2v4M8 10v4M16 18v4" />
  </>,
)
export const IconGrid = icon(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>,
)
export const IconChevronDown = icon(<path d="m6 9 6 6 6-6" />)
export const IconHistory = icon(
  <>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </>,
)

// Brand bolt lifted from public/favicon.svg (outer silhouette).
const BOLT = 'M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z'

export function Logo({ size = 20 }) {
  return (
    <svg viewBox="-2 -2 52 50" width={size} height={size} className="logo" aria-hidden="true">
      <defs>
        <linearGradient id="fw-bolt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--accent-hi, #b18cff)' }} />
          <stop offset=".55" style={{ stopColor: 'var(--accent, #8b5cf6)' }} />
          <stop offset="1" stopColor="#47bfff" />
        </linearGradient>
      </defs>
      <path
        className="logo-path"
        d={BOLT}
        pathLength="100"
        fill="url(#fw-bolt)"
        stroke="url(#fw-bolt)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ToastCheck({ size = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="toast-check"
      aria-hidden="true"
    >
      <circle className="tc-circle" cx="12" cy="12" r="9.2" pathLength="100" />
      <path className="tc-check" d="m7.6 12.3 3 3 5.8-6.2" pathLength="100" />
    </svg>
  )
}

export const IconSearch = icon(
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </>
)

export const IconTerminal = icon(
  <>
    <path d="m5 17 5-5-5-5M12 19h8" />
  </>
)

export const IconShare = icon(
  <>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </>
)

export function EmptyArt() {
  return (
    <svg viewBox="0 0 120 92" width="132" height="101" fill="none" className="empty-art" aria-hidden="true">
      <rect x="20" y="16" width="44" height="56" rx="7" transform="rotate(-8 42 44)" fill="var(--surface-2, #221f31)" stroke="var(--border-2, rgba(255,255,255,.13))" strokeWidth="2" />
      <g className="ea-front">
        <rect x="50" y="16" width="48" height="60" rx="7" transform="rotate(6 74 46)" fill="var(--surface-3, #2d2940)" stroke="var(--accent, #8b5cf6)" strokeWidth="2" />
        <text x="74" y="53" transform="rotate(6 74 46)" textAnchor="middle" fill="var(--accent, #8b5cf6)" fontSize="20" fontWeight="700" fontFamily="inherit">Aa</text>
      </g>
      <path className="ea-spark" d="M14 8c.4 2.4 1.4 3.4 3.8 3.8-2.4.4-3.4 1.4-3.8 3.8-.4-2.4-1.4-3.4-3.8-3.8 2.4-.4 3.4-1.4 3.8-3.8Z" fill="var(--accent, #8b5cf6)" />
      <path className="ea-spark ea-spark2" d="M106 60c.35 2.1 1.25 3 3.35 3.35-2.1.35-3 1.25-3.35 3.35-.35-2.1-1.25-3-3.35-3.35 2.1-.35 3-1.25 3.35-3.35Z" fill="#47bfff" />
      <path className="ea-spark ea-spark3" d="M103 14c.3 1.8 1.05 2.55 2.85 2.85-1.8.3-2.55 1.05-2.85 2.85-.3-1.8-1.05-2.55-2.85-2.85 1.8-.3 2.55-1.05 2.85-2.85Z" fill="var(--accent-hi, #c4b5fd)" />
    </svg>
  )
}
