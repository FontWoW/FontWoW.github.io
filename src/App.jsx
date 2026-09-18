import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { toPng, toBlob } from 'html-to-image'
import { isNative, saveImageNative, saveMediaNative, shareFileNative, copyImageNative, copyTextNative, openExternalUrl, registerHardwareBackHandler, triggerHaptic } from './native'
import {
  FONTS,
  FONT_CATEGORIES,
  BACKGROUNDS,
  BG_CATEGORIES,
  BG_COLLECTIONS,
  BG_TEMPLATES,
  ALL_BACKGROUNDS,
  TEXT_BOX_STYLES,
  TEXT_COLORS,
  THEME_COLORS,
  getThemeStageGradient,
  googleFontsUrlForFont,
  googleFontsUrlFor,
  TEXT_EFFECTS,
  TEXT_GRADIENTS,
  ASPECT_RATIOS,
  TEMPLATES,
} from './fonts'
import * as I from './icons'
import { STRINGS } from './strings'
import { LABEL_ASSETS, LABEL_CATEGORIES, LabelArtwork } from './labels'
import { useDesignHistory } from './useDesignHistory'
import googleFontsList from './google-fonts.json'
import { UPDATES, APP_VERSION } from './updates'
import { checkForUpdate, dismissUpdate } from './updateCheck'
import { FEATURES } from './features'
import PromptSheet from './PromptSheet'
import MediaSupporters from './MediaSupporters'
import FontGoals from './FontGoals'
import logger from './logger'
import HorizontalScroll from './components/HorizontalScroll'
import './App.css'
import './Landing.css'

const STORAGE_KEY = 'fontwow_saved_v2'
const SETTINGS_KEY = 'fontwow_settings_v2'
const CUSTOM_FONTS_KEY = 'fontwow_custom_fonts_v2'
const PINNED_FONTS_KEY = 'fontwow_pinned_fonts_v2'
const CUSTOM_TEMPLATES_KEY = 'fontwow_custom_templates_v2'
const APP_SETTINGS_KEY = 'fontwow_app_settings_v2'
const DONATE_URL = 'https://daramet.com/fontwow'
const CRYPTO_DONATE_URL = 'https://pay.oxapay.com/15417059'
const REPO_URL = 'https://github.com/FontWoW/FontWoW.github.io'
const CONTRIBUTORS_API = 'https://api.github.com/repos/FontWoW/FontWoW.github.io/contributors'

// Wiping cache and stored settings for fresh start from zero
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const legacyKeys = [
      'fontwow_saved_v1',
      'fontwow_settings_v1',
      'fontwow_custom_fonts_v1',
      'fontwow_pinned_fonts_v1',
      'fontwow_custom_templates_v1',
      'fontwow_app_settings_v1',
      'fontwow_dismissed_ios_prompt',
      'fontwow_settings_v2',
      'fontwow_app_settings_v2',
    ]
    if (!sessionStorage.getItem('fontwow_fresh_start_cleared')) {
      legacyKeys.forEach((k) => localStorage.removeItem(k))
      sessionStorage.setItem('fontwow_fresh_start_cleared', '1')
    }
  } catch {}
}

function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

// Migrate legacy flat gallery entries ({ ...state, id }) to the versioned schema:
// { id, createdAt, updatedAt, versions: [{ vId, savedAt, design }] }
function normalizeSaved(raw) {
  if (!Array.isArray(raw)) return raw ?? []
  const now = Date.now()
  return raw.map(entry => {
    if (Array.isArray(entry.versions) && entry.versions.length) return entry
    const { id, ...design } = entry
    return {
      id: typeof id === 'string' ? id : `d${now}`,
      createdAt: entry.createdAt ?? now,
      updatedAt: entry.updatedAt ?? now,
      versions: [{ vId: `v${now}`, savedAt: now, design }],
    }
  })
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function imageFromUrl(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function bytesToBase64(bytes) {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary)
}

function setAnimationProgress(node, progress) {
  node.style.setProperty('--animation-progress', String(progress))
  node.style.setProperty('--animation-offset', `${(1 - progress) * 44}px`)
  node.style.setProperty('--animation-scale', String(0.72 + progress * 0.28))
  node.style.setProperty('--animation-reveal', `${(1 - progress) * 100}%`)
}

function clearAnimationProgress(node) {
  delete node.dataset.animation
  node.style.removeProperty('--animation-progress')
  node.style.removeProperty('--animation-offset')
  node.style.removeProperty('--animation-scale')
  node.style.removeProperty('--animation-reveal')
}

function applyKashida(text, amount) {
  if (!amount) return text
  const joins = /([\u0626-\u063A\u0641-\u064A])(?=[\u0626-\u064A])/g
  return text.replace(joins, `$1${'ـ'.repeat(amount)}`)
}

function longShadow(color, depth, angle) {
  if (!depth) return 'none'
  const radians = (angle * Math.PI) / 180
  return Array.from({ length: depth }, (_, index) => {
    const distance = index + 1
    const x = Math.cos(radians) * distance
    const y = Math.sin(radians) * distance
    return `${x.toFixed(2)}px ${y.toFixed(2)}px 0 ${color}`
  }).join(', ')
}

function CurvedText({ text, mode, bend, style }) {
  const pathId = `fontwow-path-${mode}`
  const curve = Math.max(-90, Math.min(90, bend))
  const paths = {
    arc: `M 12 ${112 + curve * 0.25} Q 150 ${112 - curve * 0.65} 288 ${112 + curve * 0.25}`,
    wave: `M 8 108 Q 78 ${108 - curve * 0.72} 150 108 T 292 108`,
    circle: 'M 45 106 A 105 76 0 1 1 255 106 A 105 76 0 1 1 45 106',
  }
  return (
    <svg className="curved-text" viewBox="0 0 300 210" role="img" aria-label={text}>
      <defs><path id={pathId} d={paths[mode] ?? paths.arc} /></defs>
      <text style={style} textAnchor="middle">
        <textPath href={`#${pathId}`} startOffset="50%" textLength={mode === 'circle' ? 430 : 255} lengthAdjust="spacingAndGlyphs">{text}</textPath>
      </text>
    </svg>
  )
}

function boxStyleFor(styleId, color, custom = {}) {
  const { boxBgColor, boxOpacity = 85, boxRadius, boxPadding } = custom
  const alpha = Math.max(0.1, Math.min(1, (boxOpacity ?? 85) / 100))

  const getCustomBg = (defaultBg) => {
    if (!boxBgColor) return defaultBg
    if (boxBgColor.startsWith('#')) {
      const hex = boxBgColor.replace('#', '')
      const r = parseInt(hex.slice(0, 2), 16) || 0
      const g = parseInt(hex.slice(2, 4), 16) || 0
      const b = parseInt(hex.slice(4, 6), 16) || 0
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return boxBgColor
  }

  const style = (() => {
    switch (styleId) {
    case 'story':
      return {
        background: getCustomBg(`linear-gradient(135deg, rgba(131, 58, 180, ${alpha * 0.95}) 0%, rgba(253, 29, 29, ${alpha * 0.95}) 50%, rgba(252, 176, 69, ${alpha * 0.95}) 100%)`),
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: boxPadding ? `${boxPadding}px ${Math.round(boxPadding * 1.6)}px` : '14px 26px',
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '14px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
      }
    case 'glass':
      return {
        background: getCustomBg(`rgba(255, 255, 255, ${Math.min(0.25, alpha * 0.16)})`),
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.32)',
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '20px',
        padding: boxPadding ? `${boxPadding}px ${Math.round(boxPadding * 1.6)}px` : '16px 28px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
      }
    case 'dark-glass':
      return {
        background: getCustomBg(`rgba(15, 15, 22, ${alpha * 0.8})`),
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '20px',
        padding: boxPadding ? `${boxPadding}px ${Math.round(boxPadding * 1.6)}px` : '16px 28px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }
    case 'pill':
      return {
        background: getCustomBg(`rgba(10, 10, 16, ${alpha * 0.85})`),
        border: '1.5px solid rgba(255, 255, 255, 0.22)',
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '9999px',
        padding: boxPadding ? `${Math.round(boxPadding * 0.8)}px ${Math.round(boxPadding * 2)}px` : '12px 32px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
      }
    case 'frame':
      return {
        background: getCustomBg('transparent'),
        border: `2px solid ${color}`,
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '14px',
        padding: boxPadding ? `${boxPadding}px ${Math.round(boxPadding * 1.5)}px` : '14px 26px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      }
    case 'double-frame':
      return {
        background: getCustomBg('transparent'),
        border: `2px solid ${color}`,
        outline: `1.5px solid ${color}`,
        outlineOffset: '5px',
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '12px',
        padding: boxPadding ? `${boxPadding}px ${Math.round(boxPadding * 1.4)}px` : '16px 26px',
      }
    case 'neon-box':
      return {
        background: getCustomBg(`rgba(10, 10, 18, ${alpha * 0.9})`),
        border: `2px solid ${color}`,
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '16px',
        padding: boxPadding ? `${boxPadding}px ${Math.round(boxPadding * 1.6)}px` : '16px 28px',
        boxShadow: `0 0 20px ${color}, inset 0 0 12px ${color}33`,
      }
    case 'quote':
      return {
        background: getCustomBg(`rgba(255, 255, 255, ${Math.min(0.2, alpha * 0.14)})`),
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderInlineStart: `4px solid ${color}`,
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '14px',
        padding: boxPadding ? `${boxPadding}px ${Math.round(boxPadding * 1.6)}px` : '18px 30px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
      }
    case 'mac':
      return {
        background: getCustomBg(`rgba(250, 250, 252, ${alpha * 0.95})`),
        border: '1px solid rgba(200, 200, 210, 0.6)',
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '16px',
        padding: boxPadding ? `${boxPadding + 28}px ${boxPadding}px ${boxPadding}px` : '44px 24px 20px',
        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.28)',
        color: !boxBgColor && color === '#ffffff' ? '#1c1c1e' : color,
      }
    case 'terminal':
      return {
        background: getCustomBg(`rgba(20, 20, 28, ${alpha * 0.96})`),
        border: '1px solid rgba(80, 80, 100, 0.5)',
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '14px',
        padding: boxPadding ? `${boxPadding + 26}px ${boxPadding}px ${boxPadding}px` : '42px 24px 18px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
      }
    case 'note':
      return {
        background: getCustomBg(`rgba(254, 253, 246, ${alpha * 0.98})`),
        border: '1px solid rgba(220, 215, 195, 0.7)',
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '16px',
        padding: boxPadding ? `${boxPadding + 22}px ${boxPadding}px ${boxPadding}px` : '38px 24px 20px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
        color: !boxBgColor && color === '#ffffff' ? '#2c2c2e' : color,
      }
    case 'sms':
      return {
        background: getCustomBg(`rgba(10, 132, 255, ${alpha * 0.92})`),
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '22px',
        padding: boxPadding ? `${boxPadding}px ${Math.round(boxPadding * 1.4)}px` : '14px 24px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      }
    case 'highlight':
      return {
        background: getCustomBg(`rgba(255, 215, 0, ${alpha * 0.45})`),
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '6px',
        padding: boxPadding ? `${Math.round(boxPadding * 0.4)}px ${boxPadding}px` : '6px 18px',
        boxDecorationBreak: 'clone',
        WebkitBoxDecorationBreak: 'clone',
      }
    case 'ticket':
      return {
        background: getCustomBg(`rgba(24, 24, 34, ${alpha * 0.92})`),
        border: `2px dashed ${color}88`,
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '14px',
        padding: boxPadding ? `${boxPadding}px ${Math.round(boxPadding * 1.5)}px` : '16px 26px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
      }
    case 'box':
      return {
        background: getCustomBg(`rgba(0, 0, 0, ${alpha * 0.65})`),
        padding: boxPadding ? `${boxPadding}px ${Math.round(boxPadding * 1.5)}px` : '12px 24px',
        borderRadius: boxRadius !== null && boxRadius !== undefined ? `${boxRadius}px` : '12px',
      }
    case 'underline':
      return {
        borderBottom: `4px solid ${color}`,
        paddingBottom: boxPadding ? `${boxPadding}px` : '8px',
      }
    default:
      return {}
    }
  })()

  return styleId !== 'none' && Object.keys(style).length > 0 ? { ...style, boxSizing: 'border-box' } : style
}

const BASE_DIMENSIONS = {
  story: { width: 540, height: 960 },     // 9:16 (Instagram Story / Status)
  square: { width: 640, height: 640 },    // 1:1 (Square Post)
  portrait: { width: 540, height: 675 },  // 4:5 (Portrait Post)
  landscape: { width: 960, height: 540 }, // 16:9 (Landscape)
  free: { width: 540, height: 810 },      // 2:3 (Balanced Proportion for Free Aspect)
}

const defaultState = {
  text: '',
  fontId: 'vazirmatn',
  fontSize: 42,
  bold: false,
  italic: false,
  underline: false,
  shadow: false,
  stroke: false,
  strokeWidth: 1.5,
  opacity: 100,
  margin: 24,
  textBoxStyle: 'none',
  boxBgColor: null,
  boxOpacity: 85,
  boxRadius: null,
  boxPadding: null,
  color: '#ffffff',
  bgEnabled: false,
  bgId: 'solid-2',
  customBgUrl: null,
  customBgColor: '#8b5cf6',
  customBgGradient: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
  align: 'center',
  letterSpacing: 0,
  lineHeight: 1.4,
  direction: 'rtl',
  effect: 'none',
  effectColor: null,
  textGradient: 'g1',
  aspectRatio: 'free',
  bgFilter: { brightness: 100, contrast: 100, blur: 0, grayscale: 0 },
  warpMode: 'none',
  warpBend: 42,
  longShadowDepth: 0,
  longShadowAngle: 45,
  longShadowColor: '#2b164f',
  textMaskUrl: null,
  kashidaAmount: 0,
  animationType: 'rise',
  layers: [],
  activeLayerId: null,
}

const defaultAppSettings = {
  lang: 'fa',
  themeColor: '#8b5cf6',
}

function Sheet({ title, onClose, tall, children }) {
  const [closing, setClosing] = useState(false)
  const [drag, setDrag] = useState(null)

  function requestClose() {
    setClosing(true)
  }

  function onGrabDown(e) {
    const startY = e.clientY
    function onMove(ev) {
      setDrag(Math.max(0, ev.clientY - startY))
    }
    function onUp(ev) {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setDrag(null)
      if (ev.clientY - startY > 80) setClosing(true)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div className={`sheet-overlay${closing ? ' closing' : ''}`} onClick={requestClose}>
      <div
        className={`sheet${tall ? ' tall' : ''}${closing ? ' closing' : ''}`}
        style={
          drag != null
            ? {
                transform: `translateY(${drag}px)`,
                transition: 'none',
              }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) onClose()
        }}
      >
        <div className="sheet-grab" onPointerDown={onGrabDown}>
          <span />
        </div>
        <div className="sheet-header">
          <button className="icon-btn" onClick={requestClose} aria-label="close">
            <I.IconX size={14} />
          </button>
          <span>{title}</span>
          <span />
        </div>
        {children}
      </div>
    </div>
  )
}

function SliderRow({ label, value, display, min, max, step, onChange }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="row">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--p': `${pct}%` }}
        onChange={onChange}
      />
      <span className="val">{display ?? value}</span>
    </div>
  )
}

// Shared duplicate/reorder toolbar rendered above the active layer, used by all three layer
// kinds (text, image, label).
function LayerToolbar({ layer, onMoveLayer, onDuplicateLayer, t }) {
  return (
    <div className="layer-toolbar" onPointerDown={(e) => e.stopPropagation()}>
      <button onClick={() => onMoveLayer(layer.id, -1)} aria-label={t('sendBackward')}>
        <I.IconArrowDown size={12} />
      </button>
      <button onClick={() => onDuplicateLayer(layer.id)} aria-label={t('duplicateLayer')}>
        <I.IconCopy size={12} />
      </button>
      <button onClick={() => onMoveLayer(layer.id, 1)} aria-label={t('bringForward')}>
        <I.IconArrowUp size={12} />
      </button>
    </div>
  )
}

export default function App() {
  const [cssElement, setCssElement] = useState('h1')
  const {
    state,
    commit: commitState,
    patch: update,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDesignHistory({ ...defaultState, ...loadJSON(SETTINGS_KEY, {}) })
  const [appSettings, setAppSettings] = useState(() => ({
    ...defaultAppSettings,
    ...loadJSON(APP_SETTINGS_KEY, {}),
  }))
  const t = useCallback((key) => STRINGS[appSettings.lang]?.[key] ?? STRINGS.fa[key] ?? key, [appSettings.lang])
  const [tab, setTab] = useState('font')
  const [isControlsOpen, setIsControlsOpen] = useState(false)
  const [fontLang, setFontLang] = useState('fa')
  const [dragGuides, setDragGuides] = useState({ x: null, y: null })
  const [bgCategory, setBgCategory] = useState('solid')
  const [showGradientBuilder, setShowGradientBuilder] = useState(false)
  const [gradColor1, setGradColor1] = useState('#8e2de2')
  const [gradColor2, setGradColor2] = useState('#4a00e0')
  const [gradAngle, setGradAngle] = useState(135)
  const [gradType, setGradType] = useState('linear')
  const [showSave, setShowSave] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showDonate, setShowDonate] = useState(false)
  const [fontSuggestion, setFontSuggestion] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [logs, setLogs] = useState([])
  const [filterLevel, setFilterLevel] = useState('all')
  const [logSearch, setLogSearch] = useState('')
  const [systemHealth, setSystemHealth] = useState(() => logger.checkHealth())
  const [expandedLogId, setExpandedLogId] = useState(null)
  const [contributors, setContributors] = useState(null)
  const [contributorsError, setContributorsError] = useState(false)
  const [donations, setDonations] = useState(null)
  const [donationsError, setDonationsError] = useState(false)
  const [saved, setSaved] = useState(() => normalizeSaved(loadJSON(STORAGE_KEY, [])))
  const [expandedEntry, setExpandedEntry] = useState(null)
  const [customFonts, setCustomFonts] = useState(() => loadJSON(CUSTOM_FONTS_KEY, []))
  const [pinnedFontIds, setPinnedFontIds] = useState(() => loadJSON(PINNED_FONTS_KEY, []))
  const [customTemplates, setCustomTemplates] = useState(() => loadJSON(CUSTOM_TEMPLATES_KEY, []))
  const [showStyleStudio, setShowStyleStudio] = useState(false)
  const [styleName, setStyleName] = useState('')
  const [showLabelPicker, setShowLabelPicker] = useState(false)
  const [labelCategory, setLabelCategory] = useState('all')
  const [toast, setToast] = useState('')
  const [availableUpdate, setAvailableUpdate] = useState(null)
  const [showGoogleFontsSearch, setShowGoogleFontsSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [promptState, setPromptState] = useState(null)
  const [isExportingGif, setIsExportingGif] = useState(false)
  const [isExportingVideo, setIsExportingVideo] = useState(false)
  const [exportLoading, setExportLoading] = useState(null)
  const previewRef = useRef(null)
  const stageRef = useRef(null)
  const textRef = useRef(null)
  const tabsRef = useRef(null)
  const artboardScaleRef = useRef(1)
  const [stageDimensions, setStageDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!stageRef.current) return
    const updateSize = () => {
      if (!stageRef.current) return
      const rect = stageRef.current.getBoundingClientRect()
      setStageDimensions({ width: rect.width, height: rect.height })
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(stageRef.current)
    window.addEventListener('resize', updateSize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [isControlsOpen])

  const lastBackPressRef = useRef(0)
  useEffect(() => {
    return registerHardwareBackHandler(() => {
      if (promptState) {
        setPromptState(null)
        return true
      }
      if (showSave) {
        setShowSave(false)
        return true
      }
      if (showGallery) {
        setShowGallery(false)
        return true
      }
      if (showSettings) {
        setShowSettings(false)
        return true
      }
      if (showDonate) {
        setShowDonate(false)
        return true
      }
      if (showChangelog) {
        setShowChangelog(false)
        return true
      }
      if (showAbout) {
        setShowAbout(false)
        return true
      }
      if (showDiagnostics) {
        setShowDiagnostics(false)
        return true
      }
      if (showGoogleFontsSearch) {
        setShowGoogleFontsSearch(false)
        return true
      }
      if (showStyleStudio) {
        setShowStyleStudio(false)
        return true
      }
      if (showLabelPicker) {
        setShowLabelPicker(false)
        return true
      }
      if (state.activeLayerId) {
        update({ activeLayerId: null })
        return true
      }
      const now = Date.now()
      if (now - lastBackPressRef.current < 2000) {
        return false
      }
      lastBackPressRef.current = now
      setToast(t('backToExit') || 'برای خروج دوباره دکمه بازگشت را بزنید')
      return true
    })
  }, [
    promptState,
    showSave,
    showGallery,
    showSettings,
    showDonate,
    showChangelog,
    showAbout,
    showDiagnostics,
    showGoogleFontsSearch,
    showStyleStudio,
    showLabelPicker,
    state.activeLayerId,
    t,
    update,
  ])


  // Keep the selected layer id fresh for the once-bound keydown handler.
  const activeLayerIdRef = useRef(state.activeLayerId)
  activeLayerIdRef.current = state.activeLayerId

  const grabDragStartY = useRef(null)
  const grabHasMoved = useRef(false)

  const handleControlsGrabPointerDown = useCallback(
    (e) => {
      grabDragStartY.current = e.clientY
      grabHasMoved.current = false
      const startY = e.clientY

      function onPointerMove(ev) {
        if (grabDragStartY.current === null) return
        const deltaY = ev.clientY - startY
        if (Math.abs(deltaY) > 8) {
          grabHasMoved.current = true
        }
        if (isControlsOpen && deltaY > 26) {
          setIsControlsOpen(false)
          cleanup()
        } else if (!isControlsOpen && deltaY < -26) {
          setIsControlsOpen(true)
          cleanup()
        }
      }

      function onPointerUp() {
        cleanup()
      }

      function cleanup() {
        grabDragStartY.current = null
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('pointercancel', onPointerUp)
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
    },
    [isControlsOpen]
  )

  const [showIOSPrompt, setShowIOSPrompt] = useState(() => {
    if (isNative()) return false
    const dismissed = localStorage.getItem('fontwow_dismissed_ios_prompt') === 'true'
    if (dismissed) return false
    const ua = navigator.userAgent || ''
    const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
    if (isStandalone) return false
    const isIOS = /iphone|ipad|ipod/i.test(ua) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                  (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
    return isIOS
  })

  const filteredGoogleFonts = useMemo(() => {
    if (!searchQuery.trim()) {
      return googleFontsList.arabic
    }
    const q = searchQuery.toLowerCase()
    const matchedArabic = googleFontsList.arabic.filter(f => f.family.toLowerCase().includes(q))
    const matchedAll = googleFontsList.all.filter(name => name.toLowerCase().includes(q) && !googleFontsList.arabic.some(a => a.family === name))
    
    return [
      ...matchedArabic,
      ...matchedAll.map(name => ({ family: name, category: 'General', weights: [] }))
    ]
  }, [searchQuery])

  const allFonts = useMemo(() => [...FONTS, ...customFonts], [customFonts])
  const visibleFonts = useMemo(() => {
    const list = allFonts.filter((f) => f.dataUrl || f.lang === fontLang)
    return [...list].sort((a, b) => {
      const aIdx = pinnedFontIds.indexOf(a.id)
      const bIdx = pinnedFontIds.indexOf(b.id)
      const aPinned = aIdx !== -1
      const bPinned = bIdx !== -1
      if (aPinned && bPinned) return aIdx - bIdx
      if (aPinned) return -1
      if (bPinned) return 1
      return 0
    })
  }, [allFonts, fontLang, pinnedFontIds])
  const font = useMemo(
    () => allFonts.find((f) => f.id === state.fontId) ?? allFonts[0],
    [allFonts, state.fontId]
  )
  const currentCustomGradient = useMemo(() => {
    if (gradType === 'radial') {
      return `radial-gradient(circle at center, ${gradColor1} 0%, ${gradColor2} 100%)`
    }
    return `linear-gradient(${gradAngle}deg, ${gradColor1} 0%, ${gradColor2} 100%)`
  }, [gradType, gradAngle, gradColor1, gradColor2])

  const bg = useMemo(() => {
    if (state.bgId === 'custom-color') {
      return { id: 'custom-color', label: 'رنگ سفارشی', css: state.customBgColor || '#8b5cf6' }
    }
    if (state.bgId === 'custom-gradient') {
      return { id: 'custom-gradient', label: 'گرادیان سفارشی', css: state.customBgGradient || currentCustomGradient }
    }
    return ALL_BACKGROUNDS.find((b) => b.id === state.bgId) ?? ALL_BACKGROUNDS[0]
  }, [state.bgId, state.customBgColor, state.customBgGradient, currentCustomGradient])
  const allTemplates = useMemo(() => [...TEMPLATES, ...customTemplates], [customTemplates])
  const visibleLabelAssets = useMemo(() => {
    if (labelCategory === 'all') return LABEL_ASSETS
    return LABEL_ASSETS.filter((a) => a.category === labelCategory)
  }, [labelCategory])
  const activeLabel = state.layers.find((layer) => layer.id === state.activeLayerId && layer.type === 'label')
  const activeTextLayer = state.layers.find((layer) => layer.id === state.activeLayerId && layer.type === 'text')
  const editableFontSize = activeTextLayer?.fontSize ?? state.fontSize

  useEffect(() => {
    if (!toast) return
    const tm = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(tm)
  }, [toast])

  // Sync contentEditable content from state (without React controlling the innerHTML)
  useEffect(() => {
    if (state.warpMode !== 'none' || !textRef.current) return
    if (document.activeElement === textRef.current) return
    const formatted = applyKashida(state.text, state.kashidaAmount)
    if (textRef.current.innerText !== formatted) {
      textRef.current.innerText = formatted
    }
  }, [state.text, state.kashidaAmount, state.warpMode, state.textBoxStyle])

  useEffect(() => {
    checkForUpdate().then((update) => {
      if (update) setAvailableUpdate(update)
    })
  }, [])

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs)
      setSystemHealth(logger.checkHealth())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!showAbout || contributors || contributorsError) return
    let cancelled = false
    fetch(CONTRIBUTORS_API)
      .then((res) => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : []
          setContributors(list.filter(c => c.login !== 'github-actions[bot]' && c.login !== 'github-actions'))
        }
      })
      .catch(() => {
        if (!cancelled) setContributorsError(true)
      })
    return () => { cancelled = true }
  }, [showAbout, contributors, contributorsError])

  useEffect(() => {
    if (!showAbout || donations || donationsError) return
    let cancelled = false
    fetch('./donations.json')
      .then((res) => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setDonations(Array.isArray(data.donations) ? data.donations : [])
      })
      .catch(() => {
        if (!cancelled) setDonationsError(true)
      })
    return () => { cancelled = true }
  }, [showAbout, donations, donationsError])

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings))
  }, [appSettings])

  useEffect(() => {
    function onKeyDown(e) {
      if (!((e.metaKey || e.ctrlKey) && !e.altKey)) return
      if (e.target instanceof Element && e.target.closest('input, textarea, select')) return

      if (e.key.toLowerCase() === 'z') {
        if (e.shiftKey ? canRedo : canUndo) {
          e.preventDefault()
          if (e.shiftKey) redo()
          else undo()
        }
      } else if (e.key.toLowerCase() === 'y' && canRedo) {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canRedo, canUndo, redo, undo])

  useEffect(() => {
    document.documentElement.dir = appSettings.lang === 'en' ? 'ltr' : 'rtl'
    document.documentElement.lang = appSettings.lang
  }, [appSettings.lang])

  const updateLayer = useCallback((id, patch) => {
    update((current) => ({
      layers: current.layers.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)),
    }))
  }, [update])

  // Arrow-key nudge for the selected layer — desktop-only bonus alongside drag; ignored while
  // the user is actually typing so it doesn't fight arrow-key text navigation, and ignored
  // when nothing is selected so it never steals arrow keys from normal page use.
  useEffect(() => {
    function onKeyDown(e) {
      if (!state.activeLayerId) return
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
      const el = document.activeElement
      const isEditing = el?.isContentEditable || el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA'
      if (isEditing) return
      const layer = state.layers.find((l) => l.id === state.activeLayerId)
      if (!layer) return
      e.preventDefault()
      const step = e.shiftKey ? 3 : 0.5
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
      updateLayer(layer.id, {
        x: Math.min(95, Math.max(5, layer.x + dx)),
        y: Math.min(95, Math.max(5, layer.y + dy)),
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.activeLayerId, state.layers, updateLayer])

  useEffect(() => {
    customFonts.forEach((f) => {
      const face = new FontFace(f.family.replace(/'/g, ''), `url(${f.dataUrl})`)
      face
        .load()
        .then((loaded) => document.fonts.add(loaded))
        .catch(() => {})
    })

    let styleEl = document.getElementById('fontwow-custom-fonts-style')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'fontwow-custom-fonts-style'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = customFonts
      .map(
        (f) => `
        @font-face {
          font-family: ${f.family};
          src: url(${f.dataUrl});
        }
      `
      )
      .join('\n')
  }, [customFonts])

  useEffect(() => {
    const url = googleFontsUrlFor(fontLang)
    if (!url) return
    const linkId = `google-category-${fontLang}`
    if (document.getElementById(linkId)) return
    const link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)
  }, [fontLang])

  useLayoutEffect(() => {
    function place() {
      const wrap = tabsRef.current
      if (!wrap) return
      const btn = wrap.querySelector('.tab.active')
      const ind = wrap.querySelector('.tab-indicator')
      if (!ind) return
      if (!btn || !isControlsOpen) {
        ind.style.opacity = '0'
        return
      }
      ind.style.opacity = '1'
      ind.style.width = `${btn.offsetWidth}px`
      ind.style.transform = `translateX(${btn.offsetLeft}px)`
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
    place()
    document.fonts?.ready?.then(place)
  }, [tab, appSettings.lang, isControlsOpen])

  const [loadedFontIds, setLoadedFontIds] = useState(() => new Set())
  const [loadingFontId, setLoadingFontId] = useState(null)
  const loadingFontsRef = useRef(new Set())

  const loadFontNative = useCallback(async (f) => {
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const fontKey = `cached-font-${f.id}`
    const cssPath = `fonts/${fontKey}.css`

    try {
      const cssExists = await Filesystem.stat({
        path: cssPath,
        directory: Directory.Data
      }).then(() => true).catch(() => false)

      if (cssExists) {
        const cssFile = await Filesystem.readFile({
          path: cssPath,
          directory: Directory.Data,
          encoding: 'utf8'
        })
        injectStyleBlock(f.id, cssFile.data)
        setLoadedFontIds((prev) => new Set(prev).add(f.id))
        return
      }

      const url = googleFontsUrlForFont(f)
      if (!url) return

      setLoadingFontId(f.id)

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })
      if (!res.ok) throw new Error('Failed to fetch stylesheet')
      const cssText = await res.text()

      const urlMatches = [...cssText.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)]
      const gstaticUrls = [...new Set(urlMatches.map(m => m[1]))]

      let localCssText = cssText

      await Filesystem.mkdir({
        path: 'fonts',
        directory: Directory.Data,
        recursive: true
      }).catch(() => {})

      for (const fontUrl of gstaticUrls) {
        const hash = btoa(fontUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
        const fontFilePath = `fonts/${fontKey}-${hash}.woff2`

        const woff2Exists = await Filesystem.stat({
          path: fontFilePath,
          directory: Directory.Data
        }).then(() => true).catch(() => false)

        let base64Data = ''

        if (woff2Exists) {
          const woff2File = await Filesystem.readFile({
            path: fontFilePath,
            directory: Directory.Data
          })
          base64Data = woff2File.data
        } else {
          const fontRes = await fetch(fontUrl)
          if (!fontRes.ok) throw new Error(`Failed to download font file: ${fontUrl}`)
          const arrayBuffer = await fontRes.arrayBuffer()
          
          base64Data = arrayBufferToBase64(arrayBuffer)

          await Filesystem.writeFile({
            path: fontFilePath,
            directory: Directory.Data,
            data: base64Data
          })
        }

        const dataUri = `data:font/woff2;charset=utf-8;base64,${base64Data}`
        localCssText = localCssText.split(fontUrl).join(dataUri)
      }

      await Filesystem.writeFile({
        path: cssPath,
        directory: Directory.Data,
        data: localCssText,
        encoding: 'utf8'
      })

      injectStyleBlock(f.id, localCssText)
      setLoadedFontIds((prev) => new Set(prev).add(f.id))
      setLoadingFontId((id) => (id === f.id ? null : id))
    } catch (err) {
      console.error('Error loading native font:', err)
      setToast({ text: t('fontError'), type: 'error' })
      setLoadingFontId((id) => (id === f.id ? null : id))
    }
  }, [t])

  function injectStyleBlock(fontId, cssContent) {
    const styleId = `local-style-${fontId}`
    let style = document.getElementById(styleId)
    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.appendChild(style)
    }
    style.textContent = cssContent
  }

  function arrayBufferToBase64(buffer) {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  const loadFont = useCallback((f) => {
    if (!f || f.dataUrl) return Promise.resolve()
    if (loadedFontIds.has(f.id)) return Promise.resolve()

    // 1. Check if font is already available in document.fonts
    if (typeof document !== 'undefined' && document.fonts && f.family) {
      try {
        if (document.fonts.check(`16px ${f.family}`)) {
          setLoadedFontIds((prev) => new Set(prev).add(f.id))
          return Promise.resolve()
        }
      } catch {
        // ignore
      }
    }

    // 2. Prevent concurrent duplicate loads
    if (loadingFontsRef.current.has(f.id)) {
      return Promise.resolve()
    }
    
    if (isNative()) {
      return loadFontNative(f)
    }

    const linkId = `google-font-${f.id}`
    const existing = document.getElementById(linkId)
    if (existing) {
      setLoadedFontIds((prev) => new Set(prev).add(f.id))
      return Promise.resolve()
    }
    const url = googleFontsUrlForFont(f)
    if (!url) {
      // Local font (e.g. Arad, Ario, Sorena defined in CSS)
      setLoadedFontIds((prev) => new Set(prev).add(f.id))
      return Promise.resolve()
    }

    loadingFontsRef.current.add(f.id)
    setLoadingFontId(f.id)

    return new Promise((resolve) => {
      let settled = false

      const succeed = () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        loadingFontsRef.current.delete(f.id)
        setLoadedFontIds((prev) => new Set(prev).add(f.id))
        setLoadingFontId((id) => (id === f.id ? null : id))
        resolve()
      }

      const fail = () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        loadingFontsRef.current.delete(f.id)
        setLoadingFontId((id) => (id === f.id ? null : id))

        // Check if font actually rendered in document.fonts before alarming
        let fontActuallyReady = false
        try {
          if (document.fonts && f.family && document.fonts.check(`16px ${f.family}`)) {
            fontActuallyReady = true
          }
        } catch {
          // ignore
        }

        if (fontActuallyReady) {
          setLoadedFontIds((prev) => new Set(prev).add(f.id))
        } else {
          setToast({ text: t('fontError'), type: 'error' })
        }
        resolve()
      }

      const timer = setTimeout(fail, 12000)

      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.crossOrigin = 'anonymous'
      link.href = url

      link.onload = () => {
        if (document.fonts && f.family) {
          document.fonts.load(`16px ${f.family}`).then(succeed).catch(succeed)
        } else {
          succeed()
        }
      }

      link.onerror = () => {
        fail()
      }

      document.head.appendChild(link)
    })
  }, [loadedFontIds, loadFontNative, t])

  useEffect(() => {
    loadFont(font)
  }, [font, loadFont])

  useEffect(() => {
    function onKeyDown(e) {
      // Delete/Backspace removes the selected layer — but never while the user is
      // typing in editable content (main text canvas, inputs, textareas).
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const t = e.target
        const editing = t && (t.isContentEditable || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')
        const selectedId = activeLayerIdRef.current
        if (!editing && selectedId) {
          e.preventDefault()
          deleteLayer(selectedId)
        }
        return
      }
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (k === 'y') {
        e.preventDefault()
        redo()
      } else if (k === 's') {
        e.preventDefault()
        setShowSave(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // undo/redo/setShowSave only touch refs and stable setters, so capture once.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onUploadFont(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await fileToDataUrl(file)
      const name = file.name.replace(/\.[^.]+$/, '')
      const id = `custom-${Date.now()}`
      const entry = {
        id,
        label: name,
        family: `'${name}-${id}'`,
        rtl: true,
        dataUrl,
      }
      const next = [...customFonts, entry]
      setCustomFonts(next)
      localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(next))
      update({ fontId: id })
      setToast(t('fontAdded'))
    } catch {
      setToast({ text: t('fontError'), type: 'error' })
    }
  }

  function deleteCustomFont(id, e) {
    e.stopPropagation()
    const next = customFonts.filter((f) => f.id !== id)
    setCustomFonts(next)
    localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(next))
    setPinnedFontIds((prev) => {
      const nextPins = prev.filter((pId) => pId !== id)
      localStorage.setItem(PINNED_FONTS_KEY, JSON.stringify(nextPins))
      return nextPins
    })
    if (state.fontId === id) update({ fontId: 'vazirmatn' })
  }

  const togglePinFont = useCallback((fontId, e) => {
    e?.stopPropagation()
    setPinnedFontIds((prev) => {
      const next = prev.includes(fontId)
        ? prev.filter((id) => id !== fontId)
        : [fontId, ...prev]
      localStorage.setItem(PINNED_FONTS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  function renameCustomFont(id, e) {
    e.stopPropagation()
    const current = customFonts.find((f) => f.id === id)
    if (!current) return
    const name = window.prompt(t('renameFontPrompt'), current.label)
    if (!name || !name.trim() || name.trim() === current.label) return
    const next = customFonts.map((f) => (f.id === id ? { ...f, label: name.trim() } : f))
    setCustomFonts(next)
    localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(next))
    setToast(t('fontRenamed'))
  }

  function addGoogleFont(gf) {
    logger.info('Font', `شروع افزودن فونت گوگل: ${gf.family}`)
    logger.preflightCheck('add_font')
    const isArabic = googleFontsList.arabic.some(a => a.family === gf.family)
    const weights = gf.weights || []
    const weightsStr = weights.includes(400) && weights.includes(700) ? '400;700' : (weights.includes(400) ? '400' : (weights[0] || ''))
    const googleParam = weightsStr ? `${gf.family.replace(/\s+/g, '+')}:wght@${weightsStr}` : gf.family.replace(/\s+/g, '+')

    const id = `gfont-${gf.family.toLowerCase().replace(/\s+/g, '-')}`
    const entry = {
      id,
      label: gf.family,
      family: `'${gf.family}', sans-serif`,
      rtl: isArabic,
      lang: isArabic ? 'fa' : 'en',
      google: googleParam,
      license: 'OFL-1.1'
    }

    const next = [...customFonts, entry]
    setCustomFonts(next)
    localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(next))
    
    update({ fontId: id, direction: isArabic ? 'rtl' : 'ltr' })
    loadFont(entry)
    
    logger.info('Font', `فونت گوگل با موفقیت اضافه شد: ${gf.family}`)
    setToast(t('fontAdded'))
    setShowGoogleFontsSearch(false)
  }

  async function onUploadBgImage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    logger.info('Background', `شروع بارگذاری پس‌زمینه سفارشی: ${file.name}`)
    logger.preflightCheck('upload_bg')
    try {
      const dataUrl = await fileToDataUrl(file)
      update({ bgId: 'custom-image', customBgUrl: dataUrl })
      logger.info('Background', 'پس‌زمینه سفارشی با موفقیت اعمال شد.')
      setToast(t('bgAdded'))
    } catch {
      logger.error('Background', 'خطا در خواندن فایل پس‌زمینه سفارشی')
      setToast({ text: t('bgError'), type: 'error' })
    }
  }

  async function onUploadTextMask(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      update({ textMaskUrl: await fileToDataUrl(file), warpMode: 'none' })
      setToast(t('textMaskAdded'))
    } catch {
      setToast({ text: t('bgError'), type: 'error' })
    }
  }

  function removeBgImage(e) {
    e.stopPropagation()
    update({ customBgUrl: null, bgId: 'grad-1' })
  }

  function updateGradient(c1, c2, angle, type) {
    const nextC1 = c1 !== undefined ? c1 : gradColor1
    const nextC2 = c2 !== undefined ? c2 : gradColor2
    const nextAngle = angle !== undefined ? angle : gradAngle
    const nextType = type !== undefined ? type : gradType
    if (c1 !== undefined) setGradColor1(c1)
    if (c2 !== undefined) setGradColor2(c2)
    if (angle !== undefined) setGradAngle(angle)
    if (type !== undefined) setGradType(type)
    const css =
      nextType === 'radial'
        ? `radial-gradient(circle at center, ${nextC1} 0%, ${nextC2} 100%)`
        : `linear-gradient(${nextAngle}deg, ${nextC1} 0%, ${nextC2} 100%)`
    update({
      bgId: 'custom-gradient',
      customBgGradient: css,
    })
  }

  function swapGradientColors() {
    updateGradient(gradColor2, gradColor1)
  }

  function onOpenGradientBuilder() {
    setShowGradientBuilder((prev) => {
      const next = !prev
      if (next && state.bgId !== 'custom-gradient') {
        update({
          bgId: 'custom-gradient',
          customBgGradient: currentCustomGradient,
        })
      }
      return next
    })
  }

  function onTextInput(e) {
    update({ text: e.currentTarget.innerText.replace(/ـ/g, '') })
  }

  function addLayer() {
    const id = `layer-${Date.now()}`
    const newLayer = {
      id,
      type: 'text',
      text: t('newLayerText'),
      x: 50,
      y: 50,
      rotation: 0,
      fontId: state.fontId,
      color: state.color,
      fontSize: 28,
    }
    update({ layers: [...state.layers, newLayer], activeLayerId: id })
  }

  function applyMagicLayout() {
    const variants = [
      { fontSize: 64, align: 'center', margin: 28, letterSpacing: -1, lineHeight: 1.15, textBoxStyle: 'none' },
      { fontSize: 52, align: 'right', margin: 34, letterSpacing: 1, lineHeight: 1.35, textBoxStyle: 'glass' },
      { fontSize: 72, align: 'center', margin: 18, letterSpacing: 2, lineHeight: 1.05, textBoxStyle: 'frame' },
      { fontSize: 46, align: 'left', margin: 40, letterSpacing: 0, lineHeight: 1.5, textBoxStyle: 'box' },
    ]
    const current = variants.findIndex((variant) => variant.fontSize === state.fontSize && variant.align === state.align)
    const variant = variants[(current + 1) % variants.length]
    const layers = state.layers.map((layer, index) => ({
      ...layer,
      x: index % 2 === 0 ? 25 : 75,
      y: Math.min(82, 24 + index * 18),
      rotation: index % 2 === 0 ? -4 : 4,
    }))
    update({ ...variant, layers })
    setToast(t('magicLayoutApplied'))
  }

  async function removeSelectedImageBackground() {
    const layer = state.layers.find((item) => item.id === state.activeLayerId && item.type === 'image')
    if (!layer) return
    try {
      const image = await imageFromUrl(layer.src)
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      context.drawImage(image, 0, 0)
      const frame = context.getImageData(0, 0, canvas.width, canvas.height)
      const corners = [[0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]]
      const background = corners.reduce((sum, [x, y]) => {
        const offset = (y * canvas.width + x) * 4
        return [sum[0] + frame.data[offset], sum[1] + frame.data[offset + 1], sum[2] + frame.data[offset + 2]]
      }, [0, 0, 0]).map((value) => value / corners.length)
      for (let offset = 0; offset < frame.data.length; offset += 4) {
        const distance = Math.hypot(frame.data[offset] - background[0], frame.data[offset + 1] - background[1], frame.data[offset + 2] - background[2])
        if (distance < 72) frame.data[offset + 3] = Math.round((distance / 72) * frame.data[offset + 3])
      }
      context.putImageData(frame, 0, 0)
      updateLayer(layer.id, { src: canvas.toDataURL('image/png') })
      setToast(t('backgroundRemoved'))
    } catch (error) {
      logger.error('Image', 'خطا در حذف پس‌زمینه تصویر', error?.message)
      setToast({ text: t('backgroundRemoveFailed'), type: 'error' })
    }
  }

  function addLabel(asset) {
    const id = `label-${Date.now()}`
    const newLayer = {
      id,
      type: 'label',
      templateId: asset.id,
      text: asset.defaultText || t('newLabelText'),
      x: 50,
      y: 50,
      rotation: 0,
      width: asset.width,
      aspectRatio: asset.aspectRatio,
      color: asset.defaultColor || '#8b5cf6',
      textColor: '#ffffff',
      fontId: state.fontId,
      fontSize: 22,
      textOffsetX: 0,
      textOffsetY: 0,
    }
    update({ layers: [...state.layers, newLayer], activeLayerId: id })
    setShowLabelPicker(false)
  }

  async function onUploadLayerImage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await fileToDataUrl(file)
      const id = `layer-${Date.now()}`
      const newLayer = { id, type: 'image', src: dataUrl, x: 50, y: 50, rotation: 0, width: 120 }
      update({ layers: [...state.layers, newLayer], activeLayerId: id })
    } catch {
      setToast({ text: t('bgError'), type: 'error' })
    }
  }

  function handleLayerResize(e, layer) {
    e.stopPropagation()
    const startX = e.clientX
    const origWidth = layer.width
    const scale = (state.bgEnabled ? artboardScaleRef.current : 1) || 1
    function onMove(ev) {
      const delta = (ev.clientX - startX) / scale
      const width = Math.min(600, Math.max(30, Math.round(origWidth + delta)))
      updateLayer(layer.id, { width })
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function deleteLayer(id) {
    update({
      layers: state.layers.filter((l) => l.id !== id),
      activeLayerId: null,
    })
  }

  function handleLayerDrag(e, layer) {
    e.stopPropagation()
    update({ activeLayerId: layer.id }, { record: false })
    if (!previewRef.current) return
    const rect = previewRef.current.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const origX = layer.x
    const origY = layer.y
    const SNAP = 2 // % of canvas width/height — snap zone around center + other layers
    const otherLayers = state.layers.filter((l) => l.id !== layer.id)
    function onMove(ev) {
      const dx = ((ev.clientX - startX) / rect.width) * 100
      const dy = ((ev.clientY - startY) / rect.height) * 100
      let x = Math.min(95, Math.max(5, origX + dx))
      let y = Math.min(95, Math.max(5, origY + dy))
      let guideX = null
      let guideY = null

      if (Math.abs(x - 50) < SNAP) {
        x = 50
        guideX = rect.left + rect.width * 0.5
      } else {
        const match = otherLayers.find((l) => Math.abs(x - l.x) < SNAP)
        if (match) {
          x = match.x
          guideX = rect.left + (rect.width * match.x) / 100
        }
      }

      if (Math.abs(y - 50) < SNAP) {
        y = 50
        guideY = rect.top + rect.height * 0.5
      } else {
        const match = otherLayers.find((l) => Math.abs(y - l.y) < SNAP)
        if (match) {
          y = match.y
          guideY = rect.top + (rect.height * match.y) / 100
        }
      }

      updateLayer(layer.id, { x, y })
      setDragGuides({ x: guideX, y: guideY })
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setDragGuides({ x: null, y: null })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function duplicateLayer(id) {
    const layer = state.layers.find((l) => l.id === id)
    if (!layer) return
    const newId = `layer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const copy = { ...layer, id: newId, x: Math.min(95, Math.max(5, layer.x + 5)), y: Math.min(95, Math.max(5, layer.y + 5)) }
    update({ layers: [...state.layers, copy], activeLayerId: newId })
  }

  // Layer stacking order is just array order — moving forward/backward means swapping the
  // layer with its neighbor. Already at an end -> no-op.
  function moveLayer(id, direction) {
    const layers = state.layers
    const i = layers.findIndex((l) => l.id === id)
    const j = i + direction
    if (i === -1 || j < 0 || j >= layers.length) return
    const next = [...layers]
    ;[next[i], next[j]] = [next[j], next[i]]
    update({ layers: next })
  }

  function handleLayerRotate(e, layer) {
    e.stopPropagation()
    const layerEl = e.currentTarget.closest('.text-layer')
    if (!layerEl) return
    const rect = layerEl.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    function onMove(ev) {
      const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI)
      updateLayer(layer.id, { rotation: Math.round(angle + 90) })
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function applyTemplate(tpl) {
    update({
      fontId: tpl.fontId,
      color: tpl.color,
      textBoxStyle: tpl.textBoxStyle,
      bgId: tpl.bgId,
      effect: tpl.effect,
      ...(tpl.textGradient ? { textGradient: tpl.textGradient } : {}),
      ...(tpl.effectColor !== undefined ? { effectColor: tpl.effectColor } : {}),
    })
  }

  function buildStyleFromCurrentState(label, id) {
    return {
      id,
      label,
      fontId: state.fontId,
      color: state.color,
      textBoxStyle: state.textBoxStyle,
      bgId: state.bgId,
      effect: state.effect,
      ...(state.effect === 'gradient' ? { textGradient: state.textGradient } : {}),
      ...(state.effectColor ? { effectColor: state.effectColor } : {}),
    }
  }

  function saveCustomTemplate() {
    if (!styleName.trim()) {
      setToast({ text: t('nameFirst'), type: 'error' })
      return
    }
    const entry = buildStyleFromCurrentState(styleName.trim(), `custom-${Date.now()}`)
    const next = [...customTemplates, entry]
    setCustomTemplates(next)
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(next))
    setToast(t('styleSaved'))
    setStyleName('')
    setShowStyleStudio(false)
  }

  async function copyStyleJSON() {
    if (!styleName.trim()) {
      setToast({ text: t('nameFirst'), type: 'error' })
      return
    }
    const entry = buildStyleFromCurrentState(styleName.trim(), `t-${Date.now()}`)
    const json = JSON.stringify(entry, null, 2)
    try {
      if (isNative()) await copyTextNative(json)
      else await navigator.clipboard.writeText(json)
      setToast(t('styleJSONCopied'))
    } catch {
      setToast({ text: t('copyFailed'), type: 'error' })
    }
  }

  function deleteCustomTemplate(id, e) {
    e.stopPropagation()
    const next = customTemplates.filter((tpl) => tpl.id !== id)
    setCustomTemplates(next)
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(next))
  }

  const strokeColor = state.color === '#111111' ? '#fff' : '#111'

  let effectStyle = {}
  switch (state.effect) {
    case 'gradient': {
      const grad = TEXT_GRADIENTS.find((g) => g.id === state.textGradient) ?? TEXT_GRADIENTS[0]
      effectStyle = {
        backgroundImage: grad.css,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
      }
      break
    }
    case 'neon': {
      const glow = state.effectColor || (state.color === '#ffffff' ? '#00f0ff' : state.color)
      effectStyle = {
        color: '#ffffff',
        textShadow: `0 0 6px #ffffff, 0 0 14px ${glow}, 0 0 28px ${glow}, 0 0 45px ${glow}, 0 0 70px ${glow}`,
      }
      break
    }
    case 'pop3d': {
      const shadowCol = state.effectColor || '#141420'
      const baseCol = state.color === '#111111' ? '#f1f2f6' : state.color
      effectStyle = {
        color: baseCol,
        textShadow: `1px 1px 0 ${shadowCol}, 2px 2px 0 ${shadowCol}, 3px 3px 0 ${shadowCol}, 4px 4px 0 ${shadowCol}, 5px 5px 0 ${shadowCol}, 6px 6px 0 ${shadowCol}, 7px 7px 14px rgba(0, 0, 0, 0.55)`,
      }
      break
    }
    case 'glitch': {
      effectStyle = {
        textShadow: `-2.5px -1.5px 0 #00f0ff, 2.5px 1.5px 0 #ff0055, 0 0 12px rgba(0, 240, 255, 0.45)`,
      }
      break
    }
    case 'retro': {
      const offsetCol = state.effectColor || '#121218'
      effectStyle = {
        textShadow: `4px 4px 0px ${offsetCol}, 6px 6px 0px rgba(0, 0, 0, 0.25)`,
      }
      break
    }
    case 'soft-bloom': {
      const bloom = state.effectColor || state.color || '#a78bfa'
      effectStyle = {
        textShadow: `0 0 18px ${bloom}cc, 0 0 35px ${bloom}88, 0 0 60px ${bloom}44`,
      }
      break
    }
    case 'emboss': {
      effectStyle = {
        textShadow: `-1px -1px 1px rgba(255, 255, 255, 0.65), 1px 1px 2px rgba(0, 0, 0, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.5)`,
      }
      break
    }
    case 'glass': {
      effectStyle = {
        color: 'rgba(255, 255, 255, 0.88)',
        WebkitTextStroke: '1px rgba(255, 255, 255, 0.45)',
        textShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(255, 255, 255, 0.3)',
      }
      break
    }
    case 'outline': {
      const strokeCol = state.effectColor || state.color || '#ffffff'
      effectStyle = {
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        WebkitTextStroke: `2px ${strokeCol}`,
        textShadow: `0 0 14px ${strokeCol}33`,
      }
      break
    }
    case 'fire': {
      effectStyle = {
        color: '#fffbe6',
        textShadow: `0 0 4px #ffeb3b, 0 -2px 10px #ff9800, 0 -4px 18px #ff5722, 0 -7px 28px #e64a19, 0 -10px 40px #b71c1c`,
      }
      break
    }
    case 'duo-stroke': {
      const c1 = state.color || '#ffffff'
      const outerCol = state.effectColor || '#8b5cf6'
      effectStyle = {
        color: c1,
        textShadow: `-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, -4px 0 0 ${outerCol}, 4px 0 0 ${outerCol}, 0 -4px 0 ${outerCol}, 0 4px 0 ${outerCol}`,
      }
      break
    }
    case 'chrome': {
      effectStyle = {
        backgroundImage: 'linear-gradient(180deg, #ffe899 0%, #d4af37 38%, #8c6d1f 48%, #ffffff 52%, #fdf5c9 60%, #aa771c 85%, #593e0b 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.45))',
      }
      break
    }
    case 'shadow-cast': {
      effectStyle = {
        textShadow: `1px 2px 2px rgba(0, 0, 0, 0.25), 2px 4px 5px rgba(0, 0, 0, 0.25), 4px 8px 10px rgba(0, 0, 0, 0.3), 8px 16px 20px rgba(0, 0, 0, 0.35)`,
      }
      break
    }
    default:
      break
  }

  if (state.textMaskUrl) {
    effectStyle = {
      backgroundImage: `url(${state.textMaskUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
    }
  }

  const depthShadow = longShadow(state.longShadowColor, state.longShadowDepth, state.longShadowAngle)
  const baseShadow = state.shadow ? '0 4px 18px rgba(0,0,0,0.55), 0 1px 0 rgba(0,0,0,0.3)' : ''

  const textStyle = {
    fontFamily: font.family,
    fontSize: `${state.fontSize}px`,
    fontWeight: state.bold ? 700 : 400,
    fontStyle: state.italic ? 'italic' : 'normal',
    textDecoration: state.underline ? 'underline' : 'none',
    color: state.color,
    textAlign: state.align,
    letterSpacing: `${state.letterSpacing}px`,
    lineHeight: state.lineHeight,
    direction: state.direction,
    opacity: state.opacity / 100,
    WebkitTextStroke: state.stroke ? `${state.strokeWidth}px ${strokeColor}` : 'none',
    position: 'relative',
    zIndex: 1,
    boxSizing: 'border-box',
    wordBreak: 'normal',
    overflowWrap: 'break-word',
    ...effectStyle,
    textShadow: [effectStyle.textShadow, baseShadow, depthShadow !== 'none' ? depthShadow : ''].filter(Boolean).join(', ') || 'none',
    ...boxStyleFor(state.textBoxStyle, state.color, {
      boxBgColor: state.boxBgColor,
      boxOpacity: state.boxOpacity,
      boxRadius: state.boxRadius,
      boxPadding: state.boxPadding,
    }),
    ...(state.textBoxStyle !== 'none'
      ? {
          width: 'fit-content',
          maxWidth: '96%',
          boxSizing: 'border-box',
        }
      : {}),
  }
  const displayText = applyKashida(state.text, state.kashidaAmount)
  const curvedTextStyle = {
    fontFamily: font.family,
    fontSize: `${Math.min(72, state.fontSize)}px`,
    fontWeight: state.bold ? 700 : 400,
    fontStyle: state.italic ? 'italic' : 'normal',
    fill: state.color,
    opacity: state.opacity / 100,
    letterSpacing: `${state.letterSpacing}px`,
    textShadow: textStyle.textShadow,
    paintOrder: 'stroke fill',
    stroke: state.stroke ? strokeColor : 'none',
    strokeWidth: state.stroke ? state.strokeWidth : 0,
  }

  const generatedCSS = `
      ${cssElement} {
        font-family: ${font.family};
        font-size: ${state.fontSize}px;
        font-weight: ${state.bold ? 700 : 400};
        font-style: ${state.italic ? 'italic' : 'normal'};
        text-decoration: ${state.underline ? 'underline' : 'none'};
        color: ${state.color};
        text-align: ${state.align};
        line-height: ${state.lineHeight};
        letter-spacing: ${state.letterSpacing}px;
        opacity: ${state.opacity / 100};
        direction: ${state.direction};${state.shadow ? `text-shadow: 0 4px 18px rgba(0,0,0,.55);` : ''}${
          state.stroke ? `-webkit-text-stroke:${state.strokeWidth}px ${strokeColor};` : ''
        }
}
      `.trim()

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  const generatedHTML = `<${cssElement}>${escapeHtml(state.text)}</${cssElement}>`

  async function copyCSS() {
    await navigator.clipboard.writeText(generatedCSS)
    setToast(t('cssCopied'))
  }

  async function copyHTML() {
    await navigator.clipboard.writeText(generatedHTML)
    setToast(t('htmlCopied'))
  }

  function downloadCSS() {
    const blob = new Blob([generatedCSS], {
      type: 'text/css',
    })

    const link = document.createElement('a')

    link.href = URL.createObjectURL(blob)
    link.download = 'styles.css'
    link.click()

    URL.revokeObjectURL(link.href)
  }

  const baseArtboardDim = BASE_DIMENSIONS[state.aspectRatio] || BASE_DIMENSIONS.story
  const artboardPaddingX = 64 // 46px left slider + 18px right padding
  const artboardPaddingY = 64 // 48px top quick bar + 16px bottom padding
  const availStageW = Math.max(120, (stageDimensions.width || 360) - artboardPaddingX)
  const availStageH = Math.max(120, (stageDimensions.height || 480) - artboardPaddingY)
  const artboardScale = state.bgEnabled
    ? Math.min(availStageW / baseArtboardDim.width, availStageH / baseArtboardDim.height)
    : 1
  const artboardDisplayWidth = Math.round(baseArtboardDim.width * artboardScale)
  const artboardDisplayHeight = Math.round(baseArtboardDim.height * artboardScale)
  artboardScaleRef.current = artboardScale

  const previewStyle = {
    padding: `${state.margin}px`,
    position: 'relative',
  }

  const bgLayerStyle = state.bgEnabled
    ? {
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        filter: `brightness(${state.bgFilter.brightness}%) contrast(${state.bgFilter.contrast}%) blur(${state.bgFilter.blur}px) grayscale(${state.bgFilter.grayscale}%)`,
        ...(state.bgId === 'custom-image' && state.customBgUrl
          ? {
              backgroundImage: `url(${state.customBgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { background: bg.css }),
      }
    : {
        display: 'none',
      }

  function lockTextContainerWidth() {
    if (!textRef.current || state.textBoxStyle === 'none') return () => {}
    const unscaledWidth = textRef.current.offsetWidth
    const origWidth = textRef.current.style.width
    const origMaxWidth = textRef.current.style.maxWidth
    // Lock exact width + 4px breathing room so subpixel font calculations in foreignObject never wrap text
    textRef.current.style.width = `${Math.ceil(unscaledWidth) + 4}px`
    textRef.current.style.maxWidth = 'none'
    return () => {
      if (textRef.current) {
        textRef.current.style.width = origWidth || ''
        textRef.current.style.maxWidth = origMaxWidth || ''
      }
    }
  }

  function prepareForExport() {
    const unlock = lockTextContainerWidth()
    const origRadius = previewRef.current?.style.borderRadius
    if (state.bgEnabled && previewRef.current) {
      previewRef.current.style.borderRadius = '0px'
    }
    return () => {
      unlock()
      if (previewRef.current && origRadius !== undefined) {
        previewRef.current.style.borderRadius = origRadius
      }
    }
  }

  async function ensureFontPainted() {
    await loadFont(font)
    try {
      const weight = state.bold ? '700' : '400'
      const style = state.italic ? 'italic' : 'normal'
      await document.fonts?.load(`${style} ${weight} ${state.fontSize}px ${font.family}`)
    } catch {}
    try {
      await document.fonts?.ready
    } catch {}
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  }

  // Native failures are invisible without logcat, so surface the real reason in the toast.
  function errorToast(key, err) {
    const detail = err?.message || String(err ?? '')
    return detail ? `${t(key)}: ${detail.slice(0, 120)}` : t(key)
  }

  async function exportPng() {
    if (!previewRef.current || exportLoading) return
    const fileName = `fontwow-${Date.now()}.png`
    setShowSave(false)
    setExportLoading({ active: true, message: t('exportingImage') || 'در حال تولید و ذخیره تصویر باکیفیت…' })
    logger.info('Export', 'شروع استخراج تصویر PNG')
    logger.preflightCheck('export_png')
    const cleanup = prepareForExport()
    try {
      await ensureFontPainted()
      let width, height, pixelRatio
      if (state.bgEnabled) {
        const base = BASE_DIMENSIONS[state.aspectRatio] || BASE_DIMENSIONS.story
        width = base.width
        height = base.height
        pixelRatio = 2
      } else {
        const rect = previewRef.current.getBoundingClientRect()
        width = Math.max(200, Math.round(rect.width))
        height = Math.max(200, Math.round(rect.height))
        pixelRatio = 2.5
      }
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio,
        cacheBust: false,
        width,
        height,
      })
      if (isNative()) {
        await saveImageNative(dataUrl, fileName)
        triggerHaptic('medium')
      } else {
        const link = document.createElement('a')
        link.download = fileName
        link.href = dataUrl
        link.click()
      }
      logger.info('Export', `تصویر PNG با موفقیت ذخیره شد: ${fileName}`)
      setToast(t('imageSaved'))
    } catch (err) {
      logger.error('Export', 'خطا در خروجی PNG', err.stack || err.message)
      console.error('exportPng failed:', err)
      setToast({ text: errorToast('imageError', err), type: 'error' })
    } finally {
      cleanup()
      setExportLoading(null)
    }
  }

  async function exportGif() {
    if (!previewRef.current || isExportingGif) return
    setIsExportingGif(true)
    setExportLoading({ active: true, message: t('gifExporting') || 'در حال ساخت فایل گیف انیمیشنی…' })
    setShowSave(false)
    const node = previewRef.current
    const cleanup = prepareForExport()
    try {
      await ensureFontPainted()
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
      const encoder = GIFEncoder()
      const frameCanvas = document.createElement('canvas')
      let width, height
      if (state.bgEnabled) {
        const base = BASE_DIMENSIONS[state.aspectRatio] || BASE_DIMENSIONS.story
        const maxGifDim = 480
        const gifScale = Math.min(1, maxGifDim / Math.max(base.width, base.height))
        width = Math.round(base.width * gifScale)
        height = Math.round(base.height * gifScale)
      } else {
        width = Math.max(320, Math.round(node.getBoundingClientRect().width))
        height = Math.max(180, Math.round(node.getBoundingClientRect().height))
      }
      frameCanvas.width = width
      frameCanvas.height = height
      const context = frameCanvas.getContext('2d', { willReadFrequently: true })
      node.dataset.animation = state.animationType
      for (let frameIndex = 0; frameIndex < 18; frameIndex += 1) {
        const progress = frameIndex / 17
        setAnimationProgress(node, progress)
        const frameUrl = await toPng(node, { pixelRatio: 1, cacheBust: false, skipFonts: true, width, height })
        const image = await imageFromUrl(frameUrl)
        context.clearRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
        const pixels = context.getImageData(0, 0, width, height).data
        const palette = quantize(pixels, 128)
        encoder.writeFrame(applyPalette(pixels, palette), width, height, { palette, delay: 70 })
      }
      encoder.finish()
      const bytes = encoder.bytes()
      const fileName = `fontwow-${Date.now()}.gif`
      if (isNative()) {
        const base64Gif = bytesToBase64(bytes)
        try {
          await saveMediaNative(base64Gif, fileName, 'image/gif')
          triggerHaptic('medium')
        } catch (saveErr) {
          logger.warn('Export', 'ذخیره مستقیم گیف در گالری ناموفق بود، باز کردن پنجره اشتراک', saveErr)
          await shareFileNative(base64Gif, fileName)
        }
      } else {
        const url = URL.createObjectURL(new Blob([bytes], { type: 'image/gif' }))
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      setToast(t('gifSaved'))
    } catch (error) {
      logger.error('Export', 'خطا در خروجی GIF', error?.stack || error?.message)
      setToast({ text: errorToast('gifError', error), type: 'error' })
    } finally {
      cleanup()
      clearAnimationProgress(node)
      setIsExportingGif(false)
      setExportLoading(null)
    }
  }

  async function exportVideo() {
    if (!previewRef.current || isExportingVideo) return
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      setToast({ text: t('videoUnsupported'), type: 'error' })
      return
    }
    setIsExportingVideo(true)
    setExportLoading({ active: true, message: t('videoExporting') || 'در حال ضبط و رندر ویدئو…' })
    setShowSave(false)
    const node = previewRef.current
    const cleanup = prepareForExport()
    try {
      await ensureFontPainted()
      const frameCanvas = document.createElement('canvas')
      let width, height
      if (state.bgEnabled) {
        const base = BASE_DIMENSIONS[state.aspectRatio] || BASE_DIMENSIONS.story
        width = Math.round(base.width / 2) * 2
        height = Math.round(base.height / 2) * 2
      } else {
        width = Math.round(Math.max(320, node.getBoundingClientRect().width) / 2) * 2
        height = Math.round(Math.max(180, node.getBoundingClientRect().height) / 2) * 2
      }
      frameCanvas.width = width
      frameCanvas.height = height
      const context = frameCanvas.getContext('2d')
      const stream = frameCanvas.captureStream(12)
      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type))
      if (!mimeType) throw new Error(t('videoUnsupported'))
      const chunks = []
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 })
      recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data)
      const stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve
        recorder.onerror = () => reject(recorder.error ?? new Error('MediaRecorder failed'))
      })
      recorder.start(250)
      node.dataset.animation = state.animationType
      for (let frameIndex = 0; frameIndex < 24; frameIndex += 1) {
        const progress = frameIndex / 23
        setAnimationProgress(node, progress)
        const frameUrl = await toPng(node, { pixelRatio: 1, cacheBust: false, skipFonts: true, width, height })
        const image = await imageFromUrl(frameUrl)
        context.clearRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
        await new Promise((resolve) => setTimeout(resolve, 84))
      }
      recorder.stop()
      await stopped
      stream.getTracks().forEach((track) => track.stop())
      const video = new Blob(chunks, { type: mimeType })
      const fileName = `fontwow-${Date.now()}.webm`
      if (isNative()) {
        const base64Video = bytesToBase64(new Uint8Array(await video.arrayBuffer()))
        try {
          await saveMediaNative(base64Video, fileName, mimeType)
          triggerHaptic('medium')
        } catch (saveErr) {
          logger.warn('Export', 'ذخیره مستقیم ویدئو در گالری ناموفق بود، باز کردن پنجره اشتراک', saveErr)
          await shareFileNative(base64Video, fileName)
        }
      } else {
        const url = URL.createObjectURL(video)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      setToast(t('videoSaved'))
    } catch (error) {
      logger.error('Export', 'خطا در خروجی ویدئو', error?.stack || error?.message)
      setToast({ text: errorToast('videoError', error), type: 'error' })
    } finally {
      cleanup()
      clearAnimationProgress(node)
      setIsExportingVideo(false)
      setExportLoading(null)
    }
  }

  async function copyImage() {
    if (!previewRef.current || exportLoading) return
    setShowSave(false)
    setExportLoading({ active: true, message: t('copyingImage') || 'در حال آماده‌سازی و کپی در کلیپ‌بورد…' })
    logger.info('Clipboard', 'شروع کپی تصویر در کلیپ‌بورد')
    logger.preflightCheck('copy_image')
    const cleanup = prepareForExport()
    try {
      await ensureFontPainted()
      let width, height
      if (state.bgEnabled) {
        const base = BASE_DIMENSIONS[state.aspectRatio] || BASE_DIMENSIONS.story
        width = base.width
        height = base.height
      } else {
        const rect = previewRef.current.getBoundingClientRect()
        width = Math.max(200, Math.round(rect.width))
        height = Math.max(200, Math.round(rect.height))
      }

      if (isNative()) {
        const dataUrl = await toPng(previewRef.current, { pixelRatio: 2, cacheBust: false, width, height })
        const mode = await copyImageNative(dataUrl, `fontwow-${Date.now()}.png`)
        // 'canceled' means the user dismissed the share sheet — say nothing.
        if (mode !== 'canceled') {
          logger.info('Clipboard', `تصویر با حالت ${mode} کپی یا اشتراک‌گذاری شد.`)
          setToast(t(mode === 'shared' ? 'imageShared' : 'imageCopied'))
        } else {
          logger.info('Clipboard', 'عملیات کپی/اشتراک‌گذاری تصویر توسط کاربر لغو شد.')
        }
      } else {
        const blob = await toBlob(previewRef.current, { pixelRatio: 2, cacheBust: false, width, height })
        if (!blob) throw new Error('Blob generation returned null')

        let copied = false
        if (navigator.clipboard && typeof navigator.clipboard.write === 'function' && typeof ClipboardItem !== 'undefined') {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            copied = true
            logger.info('Clipboard', 'تصویر با موفقیت در کلیپ‌بورد کپی شد.')
            setToast(t('imageCopied'))
          } catch (clipErr) {
            console.warn('Direct clipboard.write failed, falling back:', clipErr)
          }
        }

        if (!copied) {
          // If clipboard write is restricted in iframe/browser environment, automatically download the image
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `fontwow-${Date.now()}.png`
          link.href = url
          link.click()
          setTimeout(() => URL.revokeObjectURL(url), 1500)
          setToast({
            text: t('clipboardFallbackDownload') || 'به دلیل محدودیت کلیپ‌بورد در این محیط، تصویر مستقیم ذخیره شد.',
            type: 'info',
          })
          logger.info('Clipboard', 'به دلیل محدودیت محیط، تصویر به عنوان جایگزین مستقیم دانلود شد.')
        }
      }
    } catch (err) {
      logger.error('Clipboard', 'خطا در کپی تصویر', err.stack || err.message)
      console.error('copyImage failed:', err)
      try {
        if (isNative()) await copyTextNative(state.text)
        else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(state.text)
        logger.info('Clipboard', 'حالت پشتیبان: متن جایگزین کپی شد.')
        setToast(t('imageCopyFallback'))
      } catch {
        logger.error('Clipboard', 'حالت پشتیبان کپی متن نیز با خطا مواجه شد.')
        setToast({ text: t('copyFailed'), type: 'error' })
      }
    } finally {
      cleanup()
      setExportLoading(null)
    }
  }

  async function copyText() {
    logger.info('Clipboard', 'شروع کپی متن')
    logger.preflightCheck('copy_text')
    try {
      if (isNative()) await copyTextNative(state.text)
      else await navigator.clipboard.writeText(state.text)
      logger.info('Clipboard', 'متن با موفقیت کپی شد.')
      setToast(t('textCopied'))
    } catch {
      logger.error('Clipboard', 'خطا در کپی متن')
      setToast({ text: t('copyFailed'), type: 'error' })
    }
    setShowSave(false)
  }

  function saveToGallery() {
    if (!state.text.trim()) {
      setToast({ text: t('writeFirst'), type: 'error' })
      return
    }
    logger.info('Gallery', 'ذخیره در گالری برنامه')
    logger.preflightCheck('save_gallery')
    const snapshot = { ...state }
    const existing = saved.find(
      entry => entry.versions.length && entry.versions[entry.versions.length - 1].design.text === state.text,
    )
    if (existing) {
      const updated = {
        ...existing,
        updatedAt: Date.now(),
        versions: [...existing.versions, { vId: `v${Date.now()}`, savedAt: Date.now(), design: snapshot }],
      }
      const next = saved.map(e => (e.id === existing.id ? updated : e))
      setSaved(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      logger.info('Gallery', `نسخه جدید برای طرح ${existing.id} ذخیره شد.`)
      setToast(t('versionAdded'))
    } else {
      const entry = {
        id: `d${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        versions: [{ vId: `v${Date.now()}`, savedAt: Date.now(), design: snapshot }],
      }
      const next = [entry, ...saved].slice(0, 40)
      setSaved(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      logger.info('Gallery', `طرح با شناسه ${entry.id} در گالری داخلی برنامه ذخیره شد.`)
      setToast(t('savedToGallery'))
    }
    setShowSave(false)
  }

  function loadEntry(entry, version) {
    const versions = Array.isArray(entry.versions) && entry.versions.length ? entry.versions : []
    const design = version ? version.design : (versions[versions.length - 1]?.design ?? entry)
    commitState({ ...defaultState, ...design })
    if (textRef.current) textRef.current.innerText = design.text
    setShowGallery(false)
  }

  function deleteEntry(id, e) {
    e.stopPropagation()
    setExpandedEntry(null)
    const next = saved.filter(s => s.id !== id)
    setSaved(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function clearAll() {
    commitState({ ...defaultState })
    if (textRef.current) textRef.current.innerText = ''
    textRef.current?.focus()
  }

  const ALIGN_ORDER = ['right', 'center', 'left']
  function cycleAlign() {
    const next = ALIGN_ORDER[(ALIGN_ORDER.indexOf(state.align) + 1) % ALIGN_ORDER.length]
    update({ align: next })
  }

  function updateEditableFontSize(fontSize) {
    if (activeTextLayer) {
      updateLayer(activeTextLayer.id, { fontSize })
      return
    }
    update({ fontSize })
  }

  function resetAppSettings() {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {}
    window.location.reload()
  }

  function handlePromptSubmit(value) {
    if (value == null || !promptState) return
    const trimmed = value.trim()
    if (trimmed) {
      updateLayer(promptState.layerId, { text: trimmed })
    } else {
      deleteLayer(promptState.layerId)
    }
    setPromptState(null)
  }

  const TABS = [
    { id: 'font', label: t('tabFont'), Icon: I.IconType },
    { id: 'style', label: t('tabStyle'), Icon: I.IconSparkles },
    { id: 'box', label: t('tabBox'), Icon: I.IconSquare },
    { id: 'bg', label: t('tabBg'), Icon: I.IconImage },
    { id: 'layout', label: t('tabLayout'), Icon: I.IconSliders },
    { id: 'magic', label: t('tabMagic'), Icon: I.IconSparkles },
    { id: 'templates', label: t('tabTemplates'), Icon: I.IconGrid },
    { id: 'assets', label: t('tabAssets'), Icon: I.IconTag },
    {
      id: 'css',
      label: 'CSS',
      Icon: I.IconStar,
    },
  ]

  const HTML_ELEMENTS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div']

  const bgSwatches = useMemo(() => {
    if (bgCategory === 'solid' || bgCategory === 'colors') {
      return BG_COLLECTIONS.solid || BACKGROUNDS
    }
    if (BG_COLLECTIONS[bgCategory]) {
      return BG_COLLECTIONS[bgCategory]
    }
    if (BG_TEMPLATES[bgCategory]) {
      return BG_TEMPLATES[bgCategory]
    }
    return BG_COLLECTIONS.solid || BACKGROUNDS
  }, [bgCategory])

  const renderCanvasInner = () => (
    <>
      <div className="bg-layer" style={bgLayerStyle} />
      {state.warpMode === 'none' ? (
        <div
          className={`text-canvas tb-${state.textBoxStyle} ${state.textBoxStyle !== 'none' ? 'has-box' : ''}`}
          ref={textRef}
          style={textStyle}
          contentEditable
          suppressContentEditableWarning
          dir={state.direction}
          data-placeholder={t('placeholder')}
          onInput={onTextInput}
        />
      ) : (
        <CurvedText text={displayText || t('placeholder')} mode={state.warpMode} bend={state.warpBend} style={curvedTextStyle} />
      )}
      {state.layers.map((layer) => {
        if (layer.type === 'label') {
          const layerFont = allFonts.find((f) => f.id === layer.fontId) ?? font
          return (
            <div
              key={layer.id}
              className={`text-layer label-layer ${state.activeLayerId === layer.id ? 'active' : ''}`}
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                width: `${layer.width}px`,
                aspectRatio: layer.aspectRatio ?? '16 / 9',
                transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
              }}
              onPointerDown={(e) => handleLayerDrag(e, layer)}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={() => {
                setPromptState({ layerId: layer.id, initialText: layer.text, promptKey: 'editLabelText' })
              }}
            >
              <LabelArtwork templateId={layer.templateId} color={layer.color} />
              <span
                className="label-layer-text"
                style={{
                  color: layer.textColor,
                  fontFamily: layerFont.family,
                  fontSize: `${layer.fontSize}px`,
                  transform: `translate(${layer.textOffsetX ?? 0}%, ${layer.textOffsetY ?? 0}%)`,
                }}
              >
                {layer.text}
              </span>
              {state.activeLayerId === layer.id && (
                <>
                  <LayerToolbar layer={layer} onMoveLayer={moveLayer} onDuplicateLayer={duplicateLayer} t={t} />
                  <span className="layer-del" onPointerDown={(e) => e.stopPropagation()} onClick={() => deleteLayer(layer.id)}>
                    <I.IconX size={11} />
                  </span>
                  <span className="layer-rotate-handle" onPointerDown={(e) => handleLayerRotate(e, layer)}>
                    <I.IconRotate size={11} />
                  </span>
                  <span className="layer-resize-handle" onPointerDown={(e) => handleLayerResize(e, layer)}>
                    <I.IconArrowsLR size={11} />
                  </span>
                </>
              )}
            </div>
          )
        }
        if (layer.type === 'image') {
          return (
            <div
              key={layer.id}
              className={`text-layer image-layer ${state.activeLayerId === layer.id ? 'active' : ''}`}
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                width: `${layer.width}px`,
                transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
              }}
              onPointerDown={(e) => handleLayerDrag(e, layer)}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={layer.src} alt="" draggable={false} />
              {state.activeLayerId === layer.id && (
                <>
                  <LayerToolbar layer={layer} onMoveLayer={moveLayer} onDuplicateLayer={duplicateLayer} t={t} />
                  <span
                    className="layer-del"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => deleteLayer(layer.id)}
                  >
                    <I.IconX size={11} />
                  </span>
                  <span
                    className="layer-rotate-handle"
                    onPointerDown={(e) => handleLayerRotate(e, layer)}
                  >
                    <I.IconRotate size={11} />
                  </span>
                  <span
                    className="layer-resize-handle"
                    onPointerDown={(e) => handleLayerResize(e, layer)}
                  >
                    <I.IconArrowsLR size={11} />
                  </span>
                </>
              )}
            </div>
          )
        }
        const layerFont = allFonts.find((f) => f.id === layer.fontId) ?? font
        return (
          <div
            key={layer.id}
            className={`text-layer ${state.activeLayerId === layer.id ? 'active' : ''}`}
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
              fontFamily: layerFont.family,
              fontSize: `${layer.fontSize}px`,
              color: layer.color,
              direction: layerFont.rtl ? 'rtl' : 'ltr',
            }}
            onPointerDown={(e) => handleLayerDrag(e, layer)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => {
              setPromptState({ layerId: layer.id, initialText: layer.text, promptKey: 'editLayerText' })
            }}
          >
            {layer.text}
            {state.activeLayerId === layer.id && (
              <>
                <LayerToolbar layer={layer} onMoveLayer={moveLayer} onDuplicateLayer={duplicateLayer} t={t} />
                <span
                  className="layer-del"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => deleteLayer(layer.id)}
                >
                  <I.IconX size={11} />
                </span>
                <span
                  className="layer-rotate-handle"
                  onPointerDown={(e) => handleLayerRotate(e, layer)}
                >
                  <I.IconRotate size={11} />
                </span>
              </>
            )}
          </div>
        )
      })}
    </>
  )

  return (
    <div
      className="app"
      style={{
        '--accent': appSettings.themeColor,
        '--stage-gradient': getThemeStageGradient(appSettings.themeColor),
      }}
      data-theme-black={appSettings.themeColor === '#09090b' || appSettings.themeColor === '#000000'}
      data-theme-white={appSettings.themeColor === '#ffffff' || appSettings.themeColor === '#fff'}
    >
      <h1 className="sr-only">FontWoW — متن‌آرایی و فونت‌نویسی آنلاین فارسی</h1>
      <div className="aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className="topbar">
        <button
          className="pill-btn"
          onClick={() => {
            update({ activeLayerId: null }, { record: false })
            setShowSave(true)
          }}
        >
          <I.IconDownload size={14} /> <span className="btn-text">{t('save')}</span>
        </button>
        <div className="brand">
          <I.Logo size={22} />
          <span className="brand-name">FontWoW</span>
        </div>
        <div className="header-actions">
          <button
            className="pill-btn ghost icon-only"
            onClick={redo}
            aria-label={t('redo')}
            title={`${t('redo')} (Ctrl/Cmd + Shift + Z)`}
            disabled={!canRedo}
          >
            <I.IconRedo size={16} />
          </button>
          <button
            className="pill-btn ghost icon-only"
            onClick={undo}
            aria-label={t('undo')}
            title={`${t('undo')} (Ctrl/Cmd + Z)`}
            disabled={!canUndo}
          >
            <I.IconUndo size={16} />
          </button>
          <button
            className="pill-btn ghost icon-only"
            onClick={() => setShowSettings(true)}
            aria-label={t('settings')}
          >
            <I.IconSettings size={16} />
          </button>
          <button
            className="pill-btn ghost icon-only"
            onClick={() => setShowDonate(true)}
            aria-label={t('donate')}
          >
            <I.IconHeart size={16} />
          </button>
          <button className="pill-btn soft" onClick={() => setShowGallery(true)}>
            <I.IconImages size={14} /> <span className="btn-text">{t('gallery')}</span>
          </button>
        </div>
      </header>

      <main
        className="stage"
        ref={stageRef}
        onClick={(e) => {
          if (e.target.closest('.text-layer, .text-canvas, .curved-text-svg, .canvas-size-slider-left, .canvas-quick-bar, .quick-bar, .canvas-quick-actions, .artboard-viewport')) return
          if (isControlsOpen) {
            setIsControlsOpen(false)
          }
        }}
      >
        {state.bgEnabled ? (
          <div
            className="artboard-viewport"
            style={{
              width: `${artboardDisplayWidth}px`,
              height: `${artboardDisplayHeight}px`,
              borderRadius: `${Math.max(8, Math.round(18 * artboardScale))}px`,
            }}
          >
            <div
              className="artboard-transformer"
              style={{
                width: `${baseArtboardDim.width}px`,
                height: `${baseArtboardDim.height}px`,
                transform: `scale(${artboardScale})`,
              }}
            >
              <div
                className="stage-inner is-artboard"
                ref={previewRef}
                style={{
                  ...previewStyle,
                  width: `${baseArtboardDim.width}px`,
                  height: `${baseArtboardDim.height}px`,
                }}
                onClick={() => state.activeLayerId && update({ activeLayerId: null }, { record: false })}
              >
                {renderCanvasInner()}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="stage-inner"
            ref={previewRef}
            style={previewStyle}
            onClick={() => state.activeLayerId && update({ activeLayerId: null }, { record: false })}
          >
            {renderCanvasInner()}
          </div>
        )}
        {dragGuides.x != null && (
          <div className="snap-guide snap-guide-v" style={{ left: dragGuides.x }} />
        )}
        {dragGuides.y != null && (
          <div className="snap-guide snap-guide-h" style={{ top: dragGuides.y }} />
        )}
        {/* Floating Quick Actions Bar at the top of the canvas */}
        <div className="canvas-quick-bar" role="toolbar" aria-label="ابزارهای سریع متن">
          <button
            className="quick-bar-btn"
            onClick={cycleAlign}
            aria-label={t(`align_${state.align}`)}
            title={t(`align_${state.align}`)}
          >
            {state.align === 'right' ? (
              <I.IconAlignRight size={15} />
            ) : state.align === 'left' ? (
              <I.IconAlignLeft size={15} />
            ) : (
              <I.IconAlignCenter size={15} />
            )}
          </button>
          <button
            className={`quick-bar-btn ${state.underline ? 'on' : ''}`}
            onClick={() => update({ underline: !state.underline })}
            aria-label={t('underline')}
            title={t('underline')}
          >
            <I.IconUnderline size={14} />
          </button>
          <button
            className={`quick-bar-btn ${state.direction === 'rtl' ? 'on' : ''}`}
            onClick={() =>
              update({
                direction: state.direction === 'rtl' ? 'ltr' : 'rtl',
              })
            }
            aria-label="RTL / LTR"
            title="RTL / LTR"
          >
            <span style={{ fontSize: '10.5px', fontWeight: 700 }}>RTL</span>
          </button>
          <div className="quick-bar-divider" />
          <button className="quick-bar-btn" onClick={addLayer} aria-label={t('addLayer')} title={t('addLayer')}>
            <I.IconPlus size={11} /> <span style={{ fontSize: '11px', fontWeight: 700 }}>Aa</span>
          </button>
          <label className="quick-bar-btn" aria-label={t('addSticker')} title={t('addSticker')}>
            <input type="file" accept="image/*" onChange={onUploadLayerImage} hidden />
            <I.IconImage size={14} />
          </label>
          <button className="quick-bar-btn" onClick={() => setShowLabelPicker(true)} aria-label={t('addLabel')} title={t('addLabel')}>
            <I.IconTag size={13} />
          </button>
          {state.text && (
            <>
              <div className="quick-bar-divider" />
              <button className="quick-bar-btn danger" onClick={clearAll} aria-label={t('clear')} title={t('clear')}>
                <I.IconTrash size={14} />
              </button>
            </>
          )}
        </div>

        {/* Vertical Transparent Font Size Slider on the Left */}
        <div className="canvas-size-slider-left" title={t('size')} aria-label={t('size')}>
          <div className="size-slider-indicator">
            <span className="size-slider-val">{editableFontSize}</span>
          </div>
          <div className="size-slider-track-wrap">
            <input
              type="range"
              min={16}
              max={120}
              value={editableFontSize}
              onChange={(e) => updateEditableFontSize(+e.target.value)}
              className="size-slider-input"
              aria-label={t('size')}
            />
          </div>
          <span className="size-slider-icon">
            <I.IconTextSize size={14} />
          </span>
        </div>
      </main>

      <section className={`controls ${!isControlsOpen ? 'is-closed' : ''}`}>
        <div
          className="controls-grab-bar"
          onPointerDown={handleControlsGrabPointerDown}
          onClick={() => setIsControlsOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          aria-label={isControlsOpen ? 'بستن پنل تنظیمات' : 'باز کردن پنل تنظیمات'}
        >
          <span className="controls-grab-pill" />
        </div>

        <div className="controls-bar">
          <HorizontalScroll
            className="controls-tabs-scroll"
            trackClassName="tabs"
            trackRef={tabsRef}
            ariaLabel="تب‌های تنظیمات"
          >
            <span className="tab-indicator" aria-hidden="true" />
            {TABS.map((tb) => (
              <button
                key={tb.id}
                className={`tab ${isControlsOpen && tab === tb.id ? 'active' : ''}`}
                onClick={(e) => {
                  if (isControlsOpen && tab === tb.id) {
                    setIsControlsOpen(false)
                  } else {
                    setTab(tb.id)
                    setIsControlsOpen(true)
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                  }
                }}
              >
                <span className="tab-icon-wrap"><tb.Icon size={14} /></span>
                <span className="tab-label-text">{tb.label}</span>
              </button>
            ))}
          </HorizontalScroll>
        </div>

        <div className="panel" key={tab}>
          {tab === 'css' && (
            <div className="css-panel-scroll">
              <div className="css-panel">
                <label>{t('htmlElement')}</label>

                <div className="chip-row">
                  {HTML_ELEMENTS.map((tag) => (
                    <button
                      key={tag}
                      className={`chip ${cssElement === tag ? 'selected' : ''}`}
                      onClick={() => setCssElement(tag)}
                    >
                      <span className="chip-label">{`<${tag}>`}</span>
                    </button>
                  ))}
                </div>

                <h4 style={{ margin: '4px 0' }}>{t('preview')}</h4>

                <pre className="code-block" dir="ltr">
                  {generatedCSS}
                </pre>

                <div className="code-buttons">
                  <button className="pill-btn soft" onClick={copyCSS}>
                    {t('copyCss')}
                  </button>

                  <button className="pill-btn soft" onClick={downloadCSS}>
                    {t('downloadCss')}
                  </button>

                  <button className="pill-btn soft" onClick={copyHTML}>
                    {t('copyHtml')}
                  </button>
                </div>
              </div>
            </div>
          )}
          {tab === 'font' && (
            <>
              <HorizontalScroll trackClassName="chip-row sub-row" ariaLabel="دسته‌بندی فونت‌ها">
                {FONT_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className={`pill-tab ${fontLang === c.id ? 'active' : ''}`}
                    onClick={() => setFontLang(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </HorizontalScroll>
              <HorizontalScroll trackClassName="chip-row" ariaLabel="فهرست فونت‌ها">
                {visibleFonts.map((f) => {
                  const isPinned = pinnedFontIds.includes(f.id)
                  return (
                    <button
                      key={f.id}
                      className={`chip font-chip ${state.fontId === f.id ? 'selected' : ''} ${isPinned ? 'is-pinned' : ''} ${loadingFontId === f.id ? 'loading' : ''}`}
                      onClick={() => {
                        update({ fontId: f.id, direction: f.rtl ? 'rtl' : 'ltr' })
                        loadFont(f)
                      }}
                    >
                      <span
                        className={`pin-font-btn ${isPinned ? 'pinned' : ''}`}
                        onClick={(e) => togglePinFont(f.id, e)}
                        title={isPinned ? 'برداشتن سنجاق (آنپین)' : 'سنجاق کردن به اول لیست'}
                        aria-label={isPinned ? 'برداشتن سنجاق' : 'سنجاق کردن فونت'}
                      >
                        <I.IconPin size={11} />
                      </span>
                      {f.dataUrl && (
                        <span className="rename-font" onClick={(e) => renameCustomFont(f.id, e)}>
                          <I.IconEdit size={9} />
                        </span>
                      )}
                      {(f.dataUrl || f.id.startsWith('gfont-')) && (
                        <span className="del-font" onClick={(e) => deleteCustomFont(f.id, e)}>
                          <I.IconX size={9} />
                        </span>
                      )}
                      {loadingFontId === f.id && (
                        <span className="font-loader">
                          <I.IconLoader size={16} />
                        </span>
                      )}
                      <div className="font-chip-specimen" style={{ fontFamily: f.family }}>
                        {state.text.trim() ? state.text.trim().slice(0, 7) : (f.rtl ? 'ابر' : 'Aa')}
                      </div>
                      <div className="font-chip-meta">
                        <span className="chip-label" style={{ fontFamily: f.family }}>{f.label}</span>
                        {f.creator && (
                          <span className="chip-creator">{f.creator}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
                <label className="chip font-chip upload-chip" title={t('yourFont')}>
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={onUploadFont}
                    hidden
                  />
                  <div className="font-chip-specimen">
                    <I.IconPlus size={20} />
                  </div>
                  <div className="font-chip-meta">
                    <span className="chip-label">{t('yourFont')}</span>
                  </div>
                </label>
                <button className="chip font-chip upload-chip" onClick={() => setShowGoogleFontsSearch(true)} title={t('addGoogleFont')}>
                  <div className="font-chip-specimen">
                    <I.IconSearch size={20} />
                  </div>
                  <div className="font-chip-meta">
                    <span className="chip-label">{t('addGoogleFont')}</span>
                  </div>
                </button>
              </HorizontalScroll>
            </>
          )}

          {tab === 'style' && (
            <div className="fx-tab-wrapper">
              {/* بخش رنگ متن بالای افکت و استایل متن */}
              <div className="box-section-header" style={{ marginTop: 0 }}>
                <span className="settings-label" style={{ margin: 0 }}>
                  <I.IconPalette size={15} style={{ display: 'inline', marginInlineEnd: 6 }} />
                  {t('tabColor')}
                </span>
                <span
                  className="color-current-preview"
                  style={{
                    display: 'inline-block',
                    width: 15,
                    height: 15,
                    borderRadius: '50%',
                    background: state.color,
                    border: '1.5px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                  }}
                  title={state.color}
                />
              </div>

              <HorizontalScroll trackClassName="text-color-row" ariaLabel="رنگ متن">
                <label className="text-color-swatch text-color-custom" title="انتخاب رنگ دلخواه">
                  <input
                    type="color"
                    value={state.color}
                    onChange={(e) => update({ color: e.target.value })}
                  />
                  <I.IconPlus size={13} style={{ color: '#fff', pointerEvents: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }} />
                </label>
                {!TEXT_COLORS.includes(state.color) && (
                  <button
                    type="button"
                    className="text-color-swatch selected"
                    style={{ background: state.color }}
                    onClick={() => update({ color: state.color })}
                    title={`رنگ انتخابی: ${state.color}`}
                  />
                )}
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`text-color-swatch ${state.color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => update({ color: c })}
                    title={c}
                  />
                ))}
              </HorizontalScroll>

              <div className="box-section-header">
                <span className="settings-label" style={{ margin: 0 }}>
                  <I.IconType size={15} style={{ display: 'inline', marginInlineEnd: 6 }} />
                  {t('tabStyle')}
                </span>
              </div>

              <div className="style-grid">
                <button
                  type="button"
                  className={`toggle ${state.bold ? 'on' : ''}`}
                  onClick={() => update({ bold: !state.bold })}
                  title={t('bold')}
                >
                  <b className="style-glyph">B</b>
                  <span className="style-label">{t('bold')}</span>
                </button>
                <button
                  type="button"
                  className={`toggle ${state.italic ? 'on' : ''}`}
                  onClick={() => update({ italic: !state.italic })}
                  title={t('italic')}
                >
                  <i className="style-glyph">I</i>
                  <span className="style-label">{t('italic')}</span>
                </button>
                <button
                  type="button"
                  className={`toggle ${state.underline ? 'on' : ''}`}
                  onClick={() => update({ underline: !state.underline })}
                  title={t('underline')}
                >
                  <u className="style-glyph">U</u>
                  <span className="style-label">{t('underline')}</span>
                </button>
                <button
                  type="button"
                  className={`toggle ${state.shadow ? 'on' : ''}`}
                  onClick={() => update({ shadow: !state.shadow })}
                  title={t('shadow')}
                >
                  <I.IconShadow size={15} />
                  <span className="style-label">{t('shadow')}</span>
                </button>
                <button
                  type="button"
                  className={`toggle ${state.stroke ? 'on' : ''}`}
                  onClick={() => update({ stroke: !state.stroke })}
                  title={t('stroke')}
                >
                  <I.IconCircle size={15} />
                  <span className="style-label">{t('stroke')}</span>
                </button>
                <button
                  type="button"
                  className={`toggle ${state.direction === 'ltr' ? 'on' : ''}`}
                  onClick={() =>
                    update({
                      direction: state.direction === 'rtl' ? 'ltr' : 'rtl',
                    })
                  }
                  title={state.direction === 'rtl' ? 'RTL' : 'LTR'}
                >
                  <I.IconArrowsLR size={15} />
                  <span className="style-label">{state.direction === 'rtl' ? 'RTL' : 'LTR'}</span>
                </button>
              </div>

              <div className="box-section-header">
                <span className="settings-label" style={{ margin: 0 }}>
                  <I.IconSparkles size={15} style={{ display: 'inline', marginInlineEnd: 6 }} />
                  {t('effect')}
                </span>
                <span className="box-count-badge">{TEXT_EFFECTS.length}</span>
              </div>

              <div className="fx-chips-grid">
                {TEXT_EFFECTS.map((fx) => {
                  const isSelected = state.effect === fx.id
                  const keyMap = {
                    none: 'fx_none',
                    neon: 'fx_neon',
                    gradient: 'fx_gradient',
                    pop3d: 'fx_pop3d',
                    glitch: 'fx_glitch',
                    retro: 'fx_retro',
                    'soft-bloom': 'fx_softBloom',
                    emboss: 'fx_emboss',
                    glass: 'fx_glass',
                    outline: 'fx_outline',
                    fire: 'fx_fire',
                    'duo-stroke': 'fx_duoStroke',
                    chrome: 'fx_chrome',
                    'shadow-cast': 'fx_shadowCast',
                  }
                  const transKey = keyMap[fx.id]
                  const displayLabel = transKey && t(transKey) !== transKey ? t(transKey) : fx.label

                  return (
                    <button
                      key={fx.id}
                      type="button"
                      className={`fx-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => update({ effect: fx.id })}
                    >
                      <div className="fx-chip-preview-stage">
                        <div className={`fx-mini-specimen mini-fx-${fx.id}`}>
                          <span>Aa</span>
                        </div>
                      </div>
                      <span className="fx-chip-label">{displayLabel}</span>
                    </button>
                  )
                })}
              </div>

              {state.effect === 'gradient' && (
                <div className="fx-customizer-panel">
                  <div className="fx-customizer-header">
                    <span className="fx-customizer-title">
                      <I.IconPalette size={15} />
                      {t('fxGradientSelect')}
                    </span>
                  </div>
                  <div className="gradient-swatches-grid">
                    {TEXT_GRADIENTS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className={`gradient-swatch-card ${state.textGradient === g.id ? 'selected' : ''}`}
                        onClick={() => update({ textGradient: g.id })}
                        title={g.label}
                      >
                        <div className="gradient-preview-bar" style={{ background: g.css }} />
                        <span className="gradient-name">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {['neon', 'pop3d', 'retro', 'soft-bloom', 'outline', 'duo-stroke'].includes(state.effect) && (
                <div className="fx-customizer-panel">
                  <div className="fx-customizer-header">
                    <span className="fx-customizer-title">
                      <I.IconSliders size={15} />
                      {t('fxColor')}
                    </span>
                    {state.effectColor !== null && (
                      <button
                        type="button"
                        className="box-reset-btn"
                        onClick={() => update({ effectColor: null })}
                        title={t('fxReset')}
                      >
                        <I.IconRotate size={13} />
                        <span>{t('fxReset')}</span>
                      </button>
                    )}
                  </div>
                  <div className="box-color-row">
                    {[
                      { label: 'هماهنگ با متن', value: null, isAuto: true },
                      { label: 'سایبر بلو', value: '#00f0ff' },
                      { label: 'صورتی نئون', value: '#ff007f' },
                      { label: 'سبز نئون', value: '#00ff88' },
                      { label: 'طلایی آفتابی', value: '#ffd700' },
                      { label: 'بنفش ارغوانی', value: '#b5179e' },
                      { label: 'قرمز شعله', value: '#ff3838' },
                      { label: 'سفید خالص', value: '#ffffff' },
                      { label: 'مشکی دودی', value: '#121218' },
                    ].map((cp) => (
                      <button
                        key={cp.label}
                        type="button"
                        className={`box-color-swatch ${cp.isAuto ? (state.effectColor === null ? 'selected' : '') : (state.effectColor === cp.value ? 'selected' : '')}`}
                        style={cp.isAuto ? {} : { backgroundColor: cp.value }}
                        onClick={() => update({ effectColor: cp.value })}
                        title={cp.label}
                      >
                        {cp.isAuto && <span className="auto-text">Auto</span>}
                      </button>
                    ))}
                    <label className="box-color-swatch custom-picker" title="انتخاب رنگ دلخواه">
                      <input
                        type="color"
                        value={state.effectColor && state.effectColor.startsWith('#') ? state.effectColor : '#00f0ff'}
                        onChange={(e) => update({ effectColor: e.target.value })}
                      />
                      <I.IconPalette size={14} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'magic' && (
            <div className="layout-panel magic-panel">
              <div className="magic-intro-card">
                <div className="magic-intro-header">
                  <span className="magic-intro-badge">
                    <I.IconSparkles size={16} />
                  </span>
                  <div className="magic-intro-text-wrap">
                    <h4 className="magic-intro-title">{t('magicIntroTitle')}</h4>
                    <p className="magic-intro-desc">{t('magicIntroDesc')}</p>
                  </div>
                </div>
              </div>

              <button className="sheet-item recommended" onClick={applyMagicLayout}>
                <I.IconSparkles size={17} /> {t('magicLayout')}
              </button>

              <p className="settings-label">{t('warpText')}</p>
              <textarea
                className="text-input magic-text-input"
                rows={2}
                value={state.text}
                placeholder={t('placeholder')}
                onChange={(event) => update({ text: event.target.value })}
              />
              <div className="chip-row">
                {['none', 'arc', 'wave', 'circle'].map((mode) => (
                  <button key={mode} className={`chip ${state.warpMode === mode ? 'selected' : ''}`} onClick={() => update({ warpMode: mode, textMaskUrl: mode === 'none' ? state.textMaskUrl : null })}>
                    <span className="chip-label">{t(`warp_${mode}`)}</span>
                  </button>
                ))}
              </div>
              {state.warpMode !== 'none' && (
                <SliderRow label={t('warpBend')} min={-90} max={90} value={state.warpBend} display={`${state.warpBend}°`} onChange={(event) => update({ warpBend: +event.target.value })} />
              )}

              <p className="settings-label">{t('longShadow')}</p>
              <SliderRow label={t('shadowDepth')} min={0} max={28} value={state.longShadowDepth} onChange={(event) => update({ longShadowDepth: +event.target.value })} />
              {state.longShadowDepth > 0 && (
                <>
                  <SliderRow label={t('shadowAngle')} min={0} max={360} value={state.longShadowAngle} display={`${state.longShadowAngle}°`} onChange={(event) => update({ longShadowAngle: +event.target.value })} />
                  <label className="inline-color-field">{t('shadowColor')}<input type="color" value={state.longShadowColor} onChange={(event) => update({ longShadowColor: event.target.value })} /></label>
                </>
              )}

              <p className="settings-label">{t('textMask')}</p>
              <div className="magic-actions">
                <label className="sheet-item">
                  <input type="file" accept="image/*" onChange={onUploadTextMask} hidden />
                  <I.IconImage size={17} /> {t('chooseMaskImage')}
                </label>
                {state.textMaskUrl && <button className="sheet-item" onClick={() => update({ textMaskUrl: null })}><I.IconX size={15} /> {t('removeMask')}</button>}
              </div>

              <p className="settings-label">{t('smartKashida')}</p>
              <SliderRow label={t('kashidaAmount')} min={0} max={4} value={state.kashidaAmount} onChange={(event) => update({ kashidaAmount: +event.target.value })} />

              {state.layers.some((layer) => layer.type === 'image') && (
                <>
                  <p className="settings-label">{t('removeBackground')}</p>
                  <button className="sheet-item" disabled={!state.layers.some((layer) => layer.id === state.activeLayerId && layer.type === 'image')} onClick={removeSelectedImageBackground}>
                    <I.IconSparkles size={17} /> {t('removeSelectedBackground')}
                  </button>
                  <p className="feature-hint">{t('removeBackgroundHint')}</p>
                </>
              )}

              <p className="settings-label">{t('animation')}</p>
              <div className="chip-row">
                {['rise', 'fade', 'zoom', 'type'].map((animation) => (
                  <button key={animation} className={`chip ${state.animationType === animation ? 'selected' : ''}`} onClick={() => update({ animationType: animation })}>
                    <span className="chip-label">{t(`animation_${animation}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'box' && (
            <div className="box-tab-wrapper">
              <div className="box-chips-grid">
                {TEXT_BOX_STYLES.map((s) => {
                  const isSelected = state.textBoxStyle === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`box-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => update({ textBoxStyle: s.id })}
                    >
                      <div className="box-chip-preview-stage">
                        <div className={`box-mini-specimen mini-tb-${s.id}`}>
                          <span className="mini-text">Aa</span>
                        </div>
                      </div>
                      <span className="box-chip-label">{s.label}</span>
                    </button>
                  )
                })}
              </div>

              {state.textBoxStyle !== 'none' && (
                <div className="box-customizer-panel">
                  <div className="box-customizer-header">
                    <span className="box-customizer-title">
                      <I.IconSliders size={15} />
                      {t('boxCustomize')}
                    </span>
                    {(state.boxBgColor || state.boxOpacity !== 85 || state.boxRadius !== null || state.boxPadding !== null) && (
                      <button
                        type="button"
                        className="box-reset-btn"
                        onClick={() => update({ boxBgColor: null, boxOpacity: 85, boxRadius: null, boxPadding: null })}
                        title={t('boxReset')}
                      >
                        <I.IconRotate size={13} />
                        <span>{t('boxReset')}</span>
                      </button>
                    )}
                  </div>

                  <div className="box-control-block">
                    <span className="box-control-label">{t('boxBgColor')}</span>
                    <HorizontalScroll trackClassName="box-color-row" ariaLabel="رنگ پس‌زمینه کادر">
                      {[
                        {
                          label: 'پیش‌فرض استایل',
                          value: null,
                          isAuto: true,
                          bg: state.textBoxStyle === 'story'
                            ? 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)'
                            : state.textBoxStyle === 'glass'
                              ? 'rgba(255, 255, 255, 0.3)'
                              : state.textBoxStyle === 'dark-glass'
                                ? '#0f0f16'
                                : state.textBoxStyle === 'sms'
                                  ? '#0a84ff'
                                  : 'rgba(255, 255, 255, 0.12)',
                        },
                        { label: 'غروب اینستاگرام', value: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' },
                        { label: 'رز نئون', value: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 50%, #fda4af 100%)' },
                        { label: 'آبی اقیانوسی', value: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' },
                        { label: 'طلایی لوکس', value: 'linear-gradient(135deg, #d97706 0%, #fbbf24 50%, #fef3c7 100%)' },
                        { label: 'شفق زمردی', value: 'linear-gradient(135deg, #059669 0%, #34d399 50%, #6ee7b7 100%)' },
                        { label: 'بنفش کیهانی', value: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%)' },
                        { label: 'سان‌ست پرتقالی', value: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fed7aa 100%)' },
                        { label: 'یاقوت سرخ', value: 'linear-gradient(135deg, #be123c 0%, #fb7185 100%)' },
                        { label: 'فانتزی صورتی', value: 'linear-gradient(160deg, #ff9a9e 0%, #fecfef 100%)' },
                        { label: 'سوال آبی', value: 'linear-gradient(160deg, #1e3c72 0%, #2a5298 100%)' },
                        { label: 'مشکی ترنسلوسنت', value: '#111111' },
                        { label: 'سفید مات', value: '#ffffff' },
                      ].map((cp) => (
                        <button
                          key={cp.label}
                          type="button"
                          className={`box-color-swatch ${cp.isAuto ? (state.boxBgColor === null ? 'selected' : '') : (state.boxBgColor === cp.value ? 'selected' : '')}`}
                          style={{ background: cp.isAuto ? cp.bg : cp.value }}
                          onClick={() => update({ boxBgColor: cp.value })}
                          title={cp.label}
                        >
                          {cp.isAuto && <span className="auto-text">Auto</span>}
                        </button>
                      ))}
                      <label className="box-color-swatch custom-picker" title="انتخاب رنگ دلخواه">
                        <input
                          type="color"
                          value={state.boxBgColor && state.boxBgColor.startsWith('#') ? state.boxBgColor : '#833ab4'}
                          onChange={(e) => update({ boxBgColor: e.target.value })}
                        />
                        <I.IconPalette size={13} />
                      </label>
                    </HorizontalScroll>
                  </div>

                  <div className="box-sliders-row">
                    <div className="box-slider-cell">
                      <div className="box-slider-meta">
                        <span>{t('boxOpacity')}</span>
                        <span className="box-slider-val">{state.boxOpacity ?? 85}%</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="100"
                        value={state.boxOpacity ?? 85}
                        onChange={(e) => update({ boxOpacity: Number(e.target.value) })}
                      />
                    </div>

                    <div className="box-slider-cell">
                      <div className="box-slider-meta">
                        <span>{t('boxRadius')}</span>
                        <span className="box-slider-val">{state.boxRadius !== null ? `${state.boxRadius}px` : 'Auto'}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={state.boxRadius ?? 16}
                        onChange={(e) => update({ boxRadius: Number(e.target.value) })}
                      />
                    </div>

                    <div className="box-slider-cell">
                      <div className="box-slider-meta">
                        <span>{t('boxPadding')}</span>
                        <span className="box-slider-val">{state.boxPadding !== null ? `${state.boxPadding}px` : 'Auto'}</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="36"
                        value={state.boxPadding ?? 16}
                        onChange={(e) => update({ boxPadding: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'bg' && (
            <div className="bg-tab-container">
              {/* Background On/Off Toggle Card */}
              <div className="bg-toggle-card">
                <div className="bg-toggle-info">
                  <div className="bg-toggle-header-row">
                    <span className="bg-toggle-title">{t('enableBg')}</span>
                    <span className={`bg-status-pill ${state.bgEnabled ? 'active' : 'inactive'}`}>
                      {t(state.bgEnabled ? 'statusActive' : 'statusInactive')}
                    </span>
                  </div>
                  <span className="bg-toggle-desc">{t('bgTabHelp')}</span>
                </div>
                <button
                  type="button"
                  className={`bg-switch-btn ${state.bgEnabled ? 'is-on' : ''}`}
                  onClick={() => update({ bgEnabled: !state.bgEnabled })}
                  aria-label={t('enableBg')}
                >
                  <span className="bg-switch-thumb" />
                </button>
              </div>

              {state.bgEnabled && (
                <div className="bg-options-wrapper">
                  {/* Aspect Ratio Section (Minimal, single row, icons only) */}
                  <div className="bg-aspect-ratio-section">
                    <p className="settings-label">{t('aspectRatio')}</p>
                    <div className="aspect-ratio-minimal-row">
                      {ASPECT_RATIOS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className={`aspect-ratio-minimal-btn ${state.aspectRatio === r.id ? 'selected' : ''}`}
                          onClick={() => update({ aspectRatio: r.id })}
                          title={r.label}
                        >
                          <span className="aspect-ratio-visual" aria-hidden="true">
                            {r.id === 'free' && <I.IconMaximize size={15} />}
                            {r.id === 'story' && <span className="aspect-box" style={{ width: 9, height: 16 }} />}
                            {r.id === 'square' && <span className="aspect-box" style={{ width: 13, height: 13 }} />}
                            {r.id === 'portrait' && <span className="aspect-box" style={{ width: 11, height: 14 }} />}
                            {r.id === 'landscape' && <span className="aspect-box" style={{ width: 16, height: 9 }} />}
                          </span>
                          <span className="aspect-ratio-num">
                            {r.id === 'free' ? 'آزاد' : r.shortLabel || r.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Categories Row */}
                  <div className="chip-row sub-row">
                    {BG_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        className={`pill-tab ${bgCategory === c.id ? 'active' : ''}`}
                        onClick={() => {
                          setBgCategory(c.id)
                          if (c.id !== 'gradients') {
                            setShowGradientBuilder(false)
                          }
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Swatches Row (Single line, minimal) */}
                  <HorizontalScroll trackClassName="bg-swatches-row" ariaLabel="پالت‌های پس‌زمینه">
                    {/* Category specific dynamic buttons */}

                    {/* 1. Solid / Colors: + button is a Color Picker */}
                    {(bgCategory === 'solid' || bgCategory === 'colors') && (
                      <>
                        <label className="swatch bg-swatch bg-custom-color-btn" title="انتخاب رنگ از پالت دلخواه (کالر پیکر)">
                          <input
                            type="color"
                            value={state.customBgColor || '#8b5cf6'}
                            onChange={(e) => {
                              update({
                                bgId: 'custom-color',
                                customBgColor: e.target.value,
                              })
                            }}
                          />
                          <I.IconPlus size={16} />
                        </label>
                        {state.customBgColor && (
                          <button
                            type="button"
                            className={`swatch bg-swatch ${state.bgId === 'custom-color' ? 'selected' : ''}`}
                            style={{ background: state.customBgColor }}
                            onClick={() => update({ bgId: 'custom-color' })}
                            title={`رنگ انتخابی: ${state.customBgColor}`}
                          />
                        )}
                      </>
                    )}

                    {/* 2. Gradients: + button opens Custom Gradient Builder */}
                    {bgCategory === 'gradients' && (
                      <>
                        <button
                          type="button"
                          className={`swatch bg-swatch bg-add-btn ${showGradientBuilder || state.bgId === 'custom-gradient' ? 'active' : ''}`}
                          onClick={onOpenGradientBuilder}
                          title="ساخت گرادیان سفارشی"
                        >
                          <I.IconPlus size={16} />
                        </button>
                        {state.customBgGradient && (
                          <button
                            type="button"
                            className={`swatch bg-swatch ${state.bgId === 'custom-gradient' ? 'selected' : ''}`}
                            style={{ background: state.customBgGradient }}
                            onClick={() => {
                              update({ bgId: 'custom-gradient' })
                              setShowGradientBuilder(true)
                            }}
                            title="گرادیان سفارشی شما"
                          />
                        )}
                      </>
                    )}

                    {/* 3. Mesh: + button uploads image from device/gallery */}
                    {bgCategory === 'mesh' && (
                      <>
                        <label className="swatch bg-swatch upload-chip" title="انتخاب عکس پس‌زمینه از گالری">
                          <input type="file" accept="image/*" onChange={onUploadBgImage} hidden />
                          <I.IconPlus size={17} />
                        </label>
                        {state.customBgUrl && (
                          <button
                            className={`swatch bg-swatch image-swatch ${state.bgId === 'custom-image' ? 'selected' : ''}`}
                            style={{
                              backgroundImage: `url(${state.customBgUrl})`,
                            }}
                            onClick={() => update({ bgId: 'custom-image' })}
                            title={t('myImage')}
                          >
                            <span className="del-font" onClick={removeBgImage} title="حذف تصویر">
                              <I.IconX size={9} />
                            </span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Note: 'dark' and 'pastel' have NO '+' button as requested */}

                    {/* Preset Swatches */}
                    {bgSwatches.map((b) => (
                      <button
                        key={b.id}
                        className={`swatch bg-swatch ${state.bgId === b.id ? 'selected' : ''}`}
                        style={{
                          background:
                            b.css === 'transparent'
                              ? 'repeating-conic-gradient(#3a3a3a 0% 25%, #2a2a2a 0% 50%) 50% / 10px 10px'
                              : b.css,
                        }}
                        onClick={() => update({ bgId: b.id })}
                        title={b.label}
                      />
                    ))}
                  </HorizontalScroll>

                  {/* Gradient Builder Panel */}
                  {bgCategory === 'gradients' && showGradientBuilder && (
                    <div className="gradient-builder-card">
                      <div className="gradient-builder-header">
                        <span className="gradient-builder-title">
                          <I.IconSparkles size={14} />
                          ساخت گرادیان سفارشی
                        </span>
                        <button
                          type="button"
                          className="gradient-builder-close"
                          onClick={() => setShowGradientBuilder(false)}
                          title="بستن"
                        >
                          <I.IconX size={14} />
                        </button>
                      </div>

                      <div
                        className="gradient-live-preview"
                        style={{ background: state.customBgGradient || currentCustomGradient }}
                        title="پیش‌نمایش زنده گرادیان"
                      />

                      <div className="gradient-colors-row">
                        <label className="gradient-color-pick-item" title="انتخاب رنگ شروع">
                          <div className="gradient-color-input-wrap" style={{ background: gradColor1 }}>
                            <input
                              type="color"
                              value={gradColor1}
                              onChange={(e) => updateGradient(e.target.value, undefined)}
                            />
                          </div>
                          <div className="gradient-color-meta">
                            <span className="gradient-color-label">رنگ اول</span>
                            <span className="gradient-color-val">{gradColor1.toUpperCase()}</span>
                          </div>
                        </label>

                        <button
                          type="button"
                          className="gradient-swap-btn"
                          onClick={swapGradientColors}
                          title="جابجایی رنگ‌ها"
                        >
                          <I.IconArrowsLR size={15} />
                        </button>

                        <label className="gradient-color-pick-item" title="انتخاب رنگ پایان">
                          <div className="gradient-color-input-wrap" style={{ background: gradColor2 }}>
                            <input
                              type="color"
                              value={gradColor2}
                              onChange={(e) => updateGradient(undefined, e.target.value)}
                            />
                          </div>
                          <div className="gradient-color-meta">
                            <span className="gradient-color-label">رنگ دوم</span>
                            <span className="gradient-color-val">{gradColor2.toUpperCase()}</span>
                          </div>
                        </label>
                      </div>

                      <div className="gradient-angles-row">
                        <button
                          type="button"
                          className={`gradient-angle-btn ${gradType === 'linear' && gradAngle === 135 ? 'active' : ''}`}
                          onClick={() => updateGradient(undefined, undefined, 135, 'linear')}
                          title="مورب ۱۳۵ درجه"
                        >
                          ۱۳۵° مورب
                        </button>
                        <button
                          type="button"
                          className={`gradient-angle-btn ${gradType === 'linear' && gradAngle === 90 ? 'active' : ''}`}
                          onClick={() => updateGradient(undefined, undefined, 90, 'linear')}
                          title="عمودی ۹۰ درجه"
                        >
                          ۹۰° عمودی
                        </button>
                        <button
                          type="button"
                          className={`gradient-angle-btn ${gradType === 'linear' && gradAngle === 180 ? 'active' : ''}`}
                          onClick={() => updateGradient(undefined, undefined, 180, 'linear')}
                          title="افقی ۱۸۰ درجه"
                        >
                          ۱۸۰° افقی
                        </button>
                        <button
                          type="button"
                          className={`gradient-angle-btn ${gradType === 'linear' && gradAngle === 45 ? 'active' : ''}`}
                          onClick={() => updateGradient(undefined, undefined, 45, 'linear')}
                          title="مورب ۴۵ درجه"
                        >
                          ۴۵° مورب
                        </button>
                        <button
                          type="button"
                          className={`gradient-angle-btn ${gradType === 'radial' ? 'active' : ''}`}
                          onClick={() => updateGradient(undefined, undefined, undefined, 'radial')}
                          title="شعاعی مرکز"
                        >
                          شعاعی ⭕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sliders */}
                  <div className="layout-panel">
                    <SliderRow
                      label={t('brightness')}
                      min={50}
                      max={150}
                      value={state.bgFilter.brightness}
                      display={`${state.bgFilter.brightness}%`}
                      onChange={(e) =>
                        update({
                          bgFilter: {
                            ...state.bgFilter,
                            brightness: +e.target.value,
                          },
                        })
                      }
                    />
                    <SliderRow
                      label={t('contrast')}
                      min={50}
                      max={150}
                      value={state.bgFilter.contrast}
                      display={`${state.bgFilter.contrast}%`}
                      onChange={(e) =>
                        update({
                          bgFilter: {
                            ...state.bgFilter,
                            contrast: +e.target.value,
                          },
                        })
                      }
                    />
                    <SliderRow
                      label={t('blur')}
                      min={0}
                      max={20}
                      value={state.bgFilter.blur}
                      onChange={(e) =>
                        update({
                          bgFilter: {
                            ...state.bgFilter,
                            blur: +e.target.value,
                          },
                        })
                      }
                    />
                    <SliderRow
                      label={t('grayscale')}
                      min={0}
                      max={100}
                      value={state.bgFilter.grayscale}
                      display={`${state.bgFilter.grayscale}%`}
                      onChange={(e) =>
                        update({
                          bgFilter: {
                            ...state.bgFilter,
                            grayscale: +e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  {/* Reset Button */}
                  <div className="bg-reset-row">
                    <button
                      type="button"
                      className="pill-btn soft reset-bg-btn"
                      onClick={() => {
                        update({
                          bgEnabled: false,
                          bgId: 'solid-2',
                          customBgUrl: null,
                          customBgColor: '#8b5cf6',
                          customBgGradient: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
                          aspectRatio: 'free',
                          bgFilter: { brightness: 100, contrast: 100, blur: 0, grayscale: 0 },
                        })
                        setShowGradientBuilder(false)
                        setToast(t('bgResetSuccess'))
                      }}
                    >
                      <I.IconRefresh size={13} />
                      <span>{t('resetBgSettings')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'templates' && (
            <div className="templates-tab-wrapper">
              <div className="templates-intro-card">
                <div className="templates-intro-header">
                  <span className="templates-intro-badge">
                    <I.IconGrid size={16} />
                  </span>
                  <div className="templates-intro-text-wrap">
                    <h4 className="templates-intro-title">{t('templatesIntroTitle')}</h4>
                    <p className="templates-intro-desc">{t('templatesIntroDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="templates-grid">
                {allTemplates.map((tpl) => {
                  const tplBg = ALL_BACKGROUNDS.find((b) => b.id === tpl.bgId)
                  const isCustom = tpl.id.startsWith('custom-')
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      className="template-card"
                      onClick={() => applyTemplate(tpl)}
                    >
                      <div
                        className="template-card-canvas"
                        style={tplBg ? { background: tplBg.css } : { background: '#18181b' }}
                      >
                        <div className="template-card-preview-text" style={{ color: tpl.color || '#ffffff' }}>
                          <span>Aa</span>
                        </div>
                        {isCustom && (
                          <button
                            type="button"
                            className="template-card-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteCustomTemplate(tpl.id, e)
                            }}
                            title="حذف این قالب"
                          >
                            <I.IconX size={10} />
                          </button>
                        )}
                      </div>
                      <div className="template-card-label-bar">
                        <span className="template-card-title">{tpl.label}</span>
                      </div>
                    </button>
                  )
                })}

                <button
                  type="button"
                  className="template-card template-card-add"
                  onClick={() => {
                    setStyleName('')
                    setShowStyleStudio(true)
                  }}
                >
                  <div className="template-card-canvas add-canvas">
                    <I.IconPlus size={22} />
                  </div>
                  <div className="template-card-label-bar">
                    <span className="template-card-title">{t('saveAsTemplate')}</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {tab === 'assets' && (
            <div className="assets-panel">
              <div className="assets-intro-card">
                <div className="assets-intro-header">
                  <span className="assets-intro-badge">
                    <I.IconTag size={16} />
                  </span>
                  <div className="assets-intro-text-wrap">
                    <h4 className="assets-intro-title">{t('tabAssets')}</h4>
                    <p className="assets-intro-desc">{t('labelAssetsHint')}</p>
                  </div>
                </div>
              </div>

              <HorizontalScroll trackClassName="label-category-pills" className="label-category-pills-scroll" ariaLabel="دسته‌بندی برچسب‌ها">
                {LABEL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`pill-tab ${labelCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setLabelCategory(cat.id)}
                  >
                    {t(cat.labelKey)}
                  </button>
                ))}
              </HorizontalScroll>

              <div className="label-asset-grid">
                {visibleLabelAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    className="label-asset-card"
                    onClick={() => addLabel(asset)}
                  >
                    <div className="label-artwork-wrap">
                      <LabelArtwork templateId={asset.id} color={asset.defaultColor || '#8b5cf6'} />
                    </div>
                    <span className="label-asset-title">{t(asset.labelKey)}</span>
                  </button>
                ))}
              </div>

              {activeLabel && (
                <div className="label-editor">
                  <div className="label-editor-header">
                    <span className="label-editor-title">
                      <I.IconSliders size={14} />
                      {t('editSelectedLabel')}
                    </span>
                    <div className="layer-quick-actions">
                      <button
                        type="button"
                        className="del-font-action"
                        onClick={() => deleteLayer(activeLabel.id)}
                        title={t('deleteLayer')}
                      >
                        <I.IconTrash size={13} />
                        <span>{t('deleteLayer')}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    className="text-input label-text-input"
                    rows={2}
                    value={activeLabel.text}
                    placeholder={t('editLabelText')}
                    onChange={(e) => updateLayer(activeLabel.id, { text: e.target.value })}
                  />

                  <p className="settings-label">{t('labelFont')}</p>
                  <div className="chip-row label-font-row">
                    {visibleFonts.map((labelFont) => (
                      <button
                        key={labelFont.id}
                        type="button"
                        className={`chip font-chip ${activeLabel.fontId === labelFont.id ? 'selected' : ''}`}
                        onClick={() => {
                          updateLayer(activeLabel.id, { fontId: labelFont.id })
                          loadFont(labelFont)
                        }}
                      >
                        <span style={{ fontFamily: labelFont.family }}>{labelFont.label}</span>
                        {labelFont.creator && (
                          <span className="chip-creator" style={{ fontSize: '0.65em', color: 'var(--text-3)', marginTop: '2px', fontFamily: 'system-ui', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{labelFont.creator}</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="label-color-row">
                    <label>{t('labelColor')}<input type="color" value={activeLabel.color} onChange={(e) => updateLayer(activeLabel.id, { color: e.target.value })} /></label>
                    <label>{t('labelTextColor')}<input type="color" value={activeLabel.textColor} onChange={(e) => updateLayer(activeLabel.id, { textColor: e.target.value })} /></label>
                  </div>

                  <SliderRow label={t('size')} min={12} max={64} value={activeLabel.fontSize} onChange={(e) => updateLayer(activeLabel.id, { fontSize: +e.target.value })} />
                  <SliderRow label={t('labelTextHorizontal')} min={-45} max={45} value={activeLabel.textOffsetX ?? 0} display={`${activeLabel.textOffsetX ?? 0}%`} onChange={(e) => updateLayer(activeLabel.id, { textOffsetX: +e.target.value })} />
                  <SliderRow label={t('labelTextVertical')} min={-45} max={45} value={activeLabel.textOffsetY ?? 0} display={`${activeLabel.textOffsetY ?? 0}%`} onChange={(e) => updateLayer(activeLabel.id, { textOffsetY: +e.target.value })} />
                </div>
              )}
            </div>
          )}

          {tab === 'layout' && (
            <div className="layout-panel">
              <SliderRow
                label={t('letterSpacing')}
                min={-4}
                max={20}
                value={state.letterSpacing}
                onChange={(e) => update({ letterSpacing: +e.target.value })}
              />
              <SliderRow
                label={t('lineHeight')}
                min={0.8}
                max={2.4}
                step={0.1}
                value={state.lineHeight}
                onChange={(e) => update({ lineHeight: +e.target.value })}
              />
              <SliderRow
                label={t('strokeWidth')}
                min={0.5}
                max={6}
                step={0.5}
                value={state.strokeWidth}
                onChange={(e) => update({ strokeWidth: +e.target.value })}
              />
              <SliderRow
                label={t('opacity')}
                min={10}
                max={100}
                value={state.opacity}
                display={`${state.opacity}%`}
                onChange={(e) => update({ opacity: +e.target.value })}
              />
              <SliderRow
                label={t('margin')}
                min={0}
                max={60}
                value={state.margin}
                onChange={(e) => update({ margin: +e.target.value })}
              />
              <div className="align-row">
                {['right', 'center', 'left'].map((a) => (
                  <button
                    key={a}
                    className={`toggle ${state.align === a ? 'on' : ''}`}
                    onClick={() => update({ align: a })}
                  >
                    {t(`align_${a}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {showSave && (
        <Sheet title={t('save')} onClose={() => setShowSave(false)}>
          <div className="save-options-grid">
            <div
              className="save-option-card primary"
              role="button"
              tabIndex={0}
              onClick={exportPng}
            >
              <span className="save-card-icon-wrap">
                <I.IconDownload size={18} />
              </span>
              <div className="save-card-content">
                <span className="save-card-title">{t('saveToDevice')}</span>
                <span className="save-card-badge">PNG</span>
              </div>
            </div>

            <div
              className="save-option-card"
              role="button"
              tabIndex={0}
              onClick={copyImage}
            >
              <span className="save-card-icon-wrap">
                <I.IconCopy size={18} />
              </span>
              <div className="save-card-content">
                <span className="save-card-title">{t('copyImageBtn')}</span>
                <span className="save-card-badge">{t('clipboard')}</span>
              </div>
            </div>

            <div
              className={`save-option-card ${isExportingGif ? 'disabled' : ''}`}
              role="button"
              tabIndex={0}
              onClick={isExportingGif ? undefined : exportGif}
            >
              <span className="save-card-icon-wrap">
                <I.IconSparkles size={18} />
              </span>
              <div className="save-card-content">
                <span className="save-card-title">
                  {isExportingGif ? t('gifExporting') : t('saveAnimatedGif')}
                </span>
                <span className="save-card-badge">GIF</span>
              </div>
            </div>

            <div
              className={`save-option-card ${isExportingVideo ? 'disabled' : ''}`}
              role="button"
              tabIndex={0}
              onClick={isExportingVideo ? undefined : exportVideo}
            >
              <span className="save-card-icon-wrap">
                <I.IconDownload size={18} />
              </span>
              <div className="save-card-content">
                <span className="save-card-title">
                  {isExportingVideo ? t('videoExporting') : t('saveAnimatedVideo')}
                </span>
                <span className="save-card-badge">MP4</span>
              </div>
            </div>

            <div
              className="save-option-card"
              role="button"
              tabIndex={0}
              onClick={copyText}
            >
              <span className="save-card-icon-wrap">
                <I.IconType size={18} />
              </span>
              <div className="save-card-content">
                <span className="save-card-title">{t('copyTextBtn')}</span>
                <span className="save-card-badge">TXT</span>
              </div>
            </div>

            <div
              className="save-option-card"
              role="button"
              tabIndex={0}
              onClick={saveToGallery}
            >
              <span className="save-card-icon-wrap">
                <I.IconStar size={18} />
              </span>
              <div className="save-card-content">
                <span className="save-card-title">{t('saveToAppGallery')}</span>
                <span className="save-card-badge">{t('gallery')}</span>
              </div>
            </div>
          </div>
        </Sheet>
      )}

      {showLabelPicker && (
        <Sheet title={t('labelAssets')} onClose={() => setShowLabelPicker(false)}>
          <HorizontalScroll trackClassName="label-category-pills in-sheet" className="label-category-pills-scroll in-sheet" ariaLabel="دسته‌بندی برچسب‌ها">
            {LABEL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`pill-tab ${labelCategory === cat.id ? 'active' : ''}`}
                onClick={() => setLabelCategory(cat.id)}
              >
                {t(cat.labelKey)}
              </button>
            ))}
          </HorizontalScroll>
          <div className="label-asset-grid">
            {visibleLabelAssets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                className="label-asset-card"
                onClick={() => addLabel(asset)}
              >
                <div className="label-artwork-wrap">
                  <LabelArtwork templateId={asset.id} color={asset.defaultColor || '#8b5cf6'} />
                </div>
                <span className="label-asset-title">{t(asset.labelKey)}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {showGallery && (
        <Sheet title={t('myGallery')} tall onClose={() => setShowGallery(false)}>
          {saved.length === 0 && (
            <div className="empty">
              <I.EmptyArt />
              <p>{t('emptyGallery')}</p>
            </div>
          )}
          <div className="gallery-grid">
            {saved.map((entry) => {
              const versions = Array.isArray(entry.versions) && entry.versions.length ? entry.versions : []
              const latest = versions[versions.length - 1]?.design ?? entry
              const f = allFonts.find((x) => x.id === latest.fontId) ?? allFonts[0]
              const b = ALL_BACKGROUNDS.find((x) => x.id === latest.bgId) ?? ALL_BACKGROUNDS[0]
              const cardStyle =
                latest.bgId === 'custom-image' && latest.customBgUrl
                  ? {
                      backgroundImage: `url(${latest.customBgUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : { background: b.css }
              return (
                <div
                  key={entry.id}
                  className="gallery-card"
                  style={cardStyle}
                  onClick={() => loadEntry(entry)}
                >
                  <span
                    className="gallery-text"
                    style={{
                      fontFamily: f.family,
                      color: latest.color,
                      direction: latest.direction,
                      fontWeight: latest.bold ? 700 : 400,
                      fontStyle: latest.italic ? 'italic' : 'normal',
                    }}
                  >
                    {latest.text}
                  </span>
                  <button className="delete-btn" onClick={(e) => deleteEntry(entry.id, e)}>
                    <I.IconX size={11} />
                  </button>
                  {versions.length > 1 && (
                    <button
                      className={`versions-btn ${expandedEntry === entry.id ? 'on' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedEntry((cur) => (cur === entry.id ? null : entry.id))
                      }}
                      title={t('versions')}
                    >
                      <I.IconHistory size={11} /> {versions.length}
                    </button>
                  )}
                  {expandedEntry === entry.id && (
                    <div className="version-list" onClick={(e) => e.stopPropagation()}>
                      {versions.map((v, i) => {
                        const vd = v.design ?? v
                        const vf = allFonts.find((x) => x.id === vd.fontId) ?? allFonts[0]
                        const isCurrent = i === versions.length - 1
                        return (
                          <button
                            key={v.vId ?? i}
                            className={`version-row ${isCurrent ? 'current' : ''}`}
                            onClick={() => loadEntry(entry, v)}
                          >
                            <span
                              className="version-row-text"
                              style={{ fontFamily: vf.family, color: vd.color, direction: vd.direction }}
                            >
                              {vd.text}
                            </span>
                            <span className="version-meta">
                              {isCurrent ? t('loadLatest') : new Date(v.savedAt).toLocaleDateString()}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Sheet>
      )}

      {showStyleStudio && (
        <Sheet title={t('saveAsTemplate')} onClose={() => setShowStyleStudio(false)}>
          <p className="donate-text">{t('templatesIntroDesc')}</p>
          <p className="settings-label">{t('styleNameLabel')}</p>
          <input
            className="text-input"
            type="text"
            placeholder={t('styleNamePlaceholder')}
            value={styleName}
            onChange={(e) => setStyleName(e.target.value)}
          />
          <button className="sheet-item recommended" onClick={saveCustomTemplate}>
            <I.IconStar size={17} /> {t('saveStyleToApp')}
          </button>
          <button className="sheet-item" onClick={copyStyleJSON}>
            <I.IconCopy size={17} /> {t('copyStyleJSON')}
          </button>
          <p className="settings-label">{t('styleStudioJsonHint')}</p>
        </Sheet>
      )}

      {showDonate && (
        <Sheet title={t('donate')} onClose={() => setShowDonate(false)}>
          <p className="donate-text">{t('donateText')}</p>
          {DONATE_URL && (
            <a
              className="sheet-item recommended"
              href={DONATE_URL}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                if (isNative()) {
                  e.preventDefault()
                  openExternalUrl(DONATE_URL)
                }
              }}
            >
              <I.IconCreditCard size={17} /> {t('payViaZibal')}
            </a>
          )}
          {CRYPTO_DONATE_URL && (
            <a
              href={CRYPTO_DONATE_URL}
              target="_blank"
              rel="noreferrer"
              className="oxapay-donate-link"
              onClick={(e) => {
                if (isNative()) {
                  e.preventDefault()
                  openExternalUrl(CRYPTO_DONATE_URL)
                }
              }}
            >
              <img
                src="https://oxapay.com/donation-buttons/1.png"
                alt="OxaPay Donation Button"
                style={{ width: 185 }}
              />
            </a>
          )}
          {!DONATE_URL && !CRYPTO_DONATE_URL && (
            <p className="empty">{t('donateNotSet')}</p>
          )}
          <p className="settings-label">{t('suggestFontLabel')}</p>
          <input
            className="text-input"
            type="text"
            placeholder={t('suggestFontPlaceholder')}
            value={fontSuggestion}
            onChange={(e) => setFontSuggestion(e.target.value)}
          />
          <a
            className="sheet-item"
            href={`mailto:m4tinbeigi@gmail.com?subject=${encodeURIComponent('پیشنهاد فونت برای FontWoW')}&body=${encodeURIComponent(fontSuggestion)}`}
          >
            <I.IconMail size={17} /> {t('sendSuggestion')}
          </a>
        </Sheet>
      )}

      {showGoogleFontsSearch && (
        <Sheet title={t('addGoogleFont')} tall onClose={() => {
          setShowGoogleFontsSearch(false)
          setSearchQuery('')
        }}>
          <div className="google-fonts-search-box">
            <input
              type="text"
              className="text-input"
              style={{ marginBottom: '16px' }}
              placeholder={t('searchFontsPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="google-fonts-results" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '55vh', overflowY: 'auto', paddingBottom: '20px' }}>
            {filteredGoogleFonts.slice(0, 30).map((gf) => {
              const alreadyAdded = allFonts.some((f) => f.label.toLowerCase() === gf.family.toLowerCase())
              return (
                <div key={gf.family} className="sheet-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'default' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{gf.family}</span>
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>{gf.category} {gf.weights && gf.weights.length > 0 ? `• ${gf.weights.length} weights` : ''}</span>
                  </div>
                  <button
                    className="pill-btn soft"
                    disabled={alreadyAdded}
                    onClick={() => addGoogleFont(gf)}
                    style={{ fontSize: '13px', padding: '6px 12px' }}
                  >
                    {alreadyAdded ? t('alreadyAdded') : t('save')}
                  </button>
                </div>
              )
            })}
            {filteredGoogleFonts.length === 0 && (
              <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px 0' }}>{t('noFontsFound')}</p>
            )}
          </div>
        </Sheet>
      )}

      {showSettings && (
        <Sheet title={t('settings')} tall onClose={() => setShowSettings(false)}>
          <div className="settings-container">
            {/* App Brand Header */}
            <div className="settings-brand-card">
              <div className="settings-brand-info">
                <div className="settings-brand-logo">FW</div>
                <div>
                  <div className="settings-brand-title">FontWoW Studio</div>
                  <div className="settings-brand-sub">تایپوگرافی و طراحی کاور متن</div>
                </div>
              </div>
              <span className="settings-version-pill">v{APP_VERSION}</span>
            </div>

            {/* Customization Group */}
            <div className="settings-group">
              <span className="settings-group-header">شخصی‌سازی و ظاهر</span>

              {/* Theme Color */}
              <div className="settings-row">
                <span className="settings-row-label">
                  <I.IconPalette size={16} />
                  {t('themeColor')}
                </span>
                <div className="settings-theme-swatches">
                  {THEME_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`settings-theme-swatch ${appSettings.themeColor === c ? 'selected' : ''}`}
                      style={{ background: c, color: c }}
                      onClick={() =>
                        setAppSettings((s) => ({
                          ...s,
                          themeColor: c,
                        }))
                      }
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="settings-row">
                <span className="settings-row-label">
                  <I.IconGlobe size={16} />
                  {t('language')}
                </span>
                <div className="settings-seg-control">
                  <button
                    type="button"
                    className={`settings-seg-btn ${appSettings.lang === 'fa' ? 'active' : ''}`}
                    onClick={() => setAppSettings((s) => ({ ...s, lang: 'fa' }))}
                  >
                    فارسی
                  </button>
                  <button
                    type="button"
                    className={`settings-seg-btn ${appSettings.lang === 'en' ? 'active' : ''}`}
                    onClick={() => setAppSettings((s) => ({ ...s, lang: 'en' }))}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>

            {/* Tools & Features Group */}
            <div className="settings-group">
              <span className="settings-group-header">ابزارها و قابلیت‌ها</span>

              <button
                type="button"
                className="settings-item-btn highlight"
                onClick={() => {
                  setShowSettings(false)
                  setShowDonate(true)
                }}
              >
                <div className="settings-item-lead">
                  <I.IconHeart size={16} style={{ color: '#f43f5e' }} />
                  <span>{t('donate')}</span>
                </div>
                <div className="settings-item-trail">
                  <span style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 600 }}>حمایت مالی</span>
                  <I.IconChevronLeft size={14} />
                </div>
              </button>

              <button
                type="button"
                className="settings-item-btn"
                onClick={() => {
                  setShowSettings(false)
                  setShowChangelog(true)
                }}
              >
                <div className="settings-item-lead">
                  <I.IconStar size={16} />
                  <span>{t('whatsNew')}</span>
                </div>
                <div className="settings-item-trail">
                  <span>تغییرات جدید</span>
                  <I.IconChevronLeft size={14} />
                </div>
              </button>

              <a
                className="settings-item-btn"
                href="#/share"
                onClick={() => setShowSettings(false)}
              >
                <div className="settings-item-lead">
                  <I.IconImages size={16} />
                  <span>{t('shareKitLink')}</span>
                </div>
                <div className="settings-item-trail">
                  <I.IconChevronLeft size={14} />
                </div>
              </a>

              <button
                type="button"
                className="settings-item-btn"
                onClick={() => {
                  setShowSettings(false)
                  setShowDiagnostics(true)
                }}
              >
                <div className="settings-item-lead">
                  <I.IconTerminal size={16} />
                  <span>{t('diagnosticsTitle')}</span>
                </div>
                <div className="settings-item-trail">
                  <span
                    className={`health-dot ${systemHealth.hasError ? 'red' : systemHealth.hasWarning ? 'yellow' : 'green'}`}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      display: 'inline-block',
                      background: systemHealth.hasError ? '#ef4444' : systemHealth.hasWarning ? '#eab308' : '#22c55e',
                      boxShadow: systemHealth.hasError
                        ? '0 0 8px #ef4444'
                        : systemHealth.hasWarning
                          ? '0 0 8px #eab308'
                          : '0 0 8px #22c55e',
                    }}
                  />
                  <I.IconChevronLeft size={14} />
                </div>
              </button>

              <button
                type="button"
                className="settings-item-btn"
                onClick={() => {
                  setShowSettings(false)
                  setShowAbout(true)
                }}
              >
                <div className="settings-item-lead">
                  <I.IconSparkles size={16} />
                  <span>درباره‌ی FontWoW</span>
                </div>
                <div className="settings-item-trail">
                  <I.IconChevronLeft size={14} />
                </div>
              </button>
            </div>

            {/* Community & Links Group */}
            <div className="settings-group">
              <span className="settings-group-header">ارتباط و جامعه</span>

              <a
                className="settings-item-btn"
                href="https://t.me/FontWoW"
                target="_blank"
                rel="noreferrer"
              >
                <div className="settings-item-lead">
                  <I.IconTelegram size={16} style={{ color: '#229ed9' }} />
                  <span>کانال تلگرام</span>
                </div>
                <div className="settings-item-trail">
                  <span style={{ direction: 'ltr', fontFamily: 'monospace' }}>@FontWoW</span>
                  <I.IconExternal size={13} />
                </div>
              </a>

              <a
                className="settings-item-btn"
                href="https://t.me/+IAzR2ntpvNVkMWI0"
                target="_blank"
                rel="noreferrer"
              >
                <div className="settings-item-lead">
                  <I.IconTelegram size={16} style={{ color: '#229ed9' }} />
                  <span>گروه گفتگو و پشتیبانی</span>
                </div>
                <div className="settings-item-trail">
                  <I.IconExternal size={13} />
                </div>
              </a>

              <a
                className="settings-item-btn"
                href="https://github.com/FontWoW/FontWoW.github.io"
                target="_blank"
                rel="noreferrer"
              >
                <div className="settings-item-lead">
                  <I.IconGithub size={16} />
                  <span>گیت‌هاب پروژه</span>
                </div>
                <div className="settings-item-trail">
                  <I.IconExternal size={13} />
                </div>
              </a>

              <a className="settings-item-btn" href="mailto:m4tinbeigi@gmail.com">
                <div className="settings-item-lead">
                  <I.IconMail size={16} />
                  <span>ارتباط با سازنده</span>
                </div>
                <div className="settings-item-trail">
                  <span style={{ direction: 'ltr', fontSize: '11px' }}>m4tinbeigi@gmail.com</span>
                </div>
              </a>
            </div>

            {/* Legal / Attribution */}
            <div className="settings-group">
              <span className="settings-group-header">{t('fontLicenses')}</span>
              <div style={{ padding: '8px 14px 12px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '11.5px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                  {t('fontLicensesText')}
                </p>
                <a
                  className="settings-item-btn"
                  style={{ borderRadius: '8px', background: 'var(--surface-2)', padding: '8px 12px', border: '1px solid var(--border-1)' }}
                  href="https://fonts.google.com/attribution"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="settings-item-lead">
                    <I.IconExternal size={14} />
                    <span style={{ fontSize: '12px' }}>Google Fonts Attribution</span>
                  </div>
                  <I.IconExternal size={12} />
                </a>
              </div>
            </div>

            {/* Reset Settings Button */}
            <button type="button" className="settings-danger-btn" onClick={resetAppSettings}>
              <I.IconRefresh size={15} />
              <span>{t('resetSettings')}</span>
            </button>
          </div>
        </Sheet>
      )}

      {showChangelog && (
        <Sheet title={t('whatsNew')} tall onClose={() => setShowChangelog(false)}>
          <div className="changelog-container" style={{ padding: '0 8px 24px 8px' }}>
            {UPDATES.map((up) => {
              const info = appSettings.lang === 'fa' ? up.fa : up.en
              return (
                <div
                  key={up.version}
                  className="changelog-version"
                  style={{
                    marginBottom: '24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          background: 'var(--accent)',
                          color: '#000',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                        }}
                      >
                        v{up.version}
                      </span>
                      <span>{info.title}</span>
                    </h3>
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{up.date}</span>
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: appSettings.lang === 'fa' ? 0 : '20px',
                      paddingRight: appSettings.lang === 'fa' ? '20px' : 0,
                      listStyleType: 'disc',
                      lineHeight: '1.6',
                    }}
                  >
                    {info.changes.map((change, idx) => (
                      <li key={idx} style={{ marginBottom: '8px', fontSize: '0.9rem', opacity: 0.9 }}>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </Sheet>
      )}

      {showAbout && (
        <Sheet title="درباره‌ی FontWoW" tall onClose={() => setShowAbout(false)}>
          <div className="about-sheet" dir="rtl">
            <p className="donate-text">
              متن‌آرایی آنلاین — بنویس، استایل بده، عکس بگیر. کاملاً رایگان و client-side، بدون حساب کاربری.
            </p>

            <p className="settings-label">امکانات</p>
            <div className="landing-grid">
              {FEATURES.map((f, i) => {
                const Icon = I[f.iconName]
                return (
                  <div className="landing-card" key={i}>
                    <div className="landing-card-icon"><Icon size={20} /></div>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                )
              })}
            </div>

            <p className="settings-label">حمایت مالی</p>
            <p className="donate-text">
              تمام مبالغی که حمایت مالی می‌شن صرف خرید فونت‌های جدید با لایسنس می‌شه تا رایگان و در دسترس همه توی FontWoW قرار بگیرن.
            </p>
            <button
              className="sheet-item recommended"
              onClick={() => {
                setShowAbout(false)
                setShowDonate(true)
              }}
            >
              <I.IconHeart size={17} /> حمایت مالی
            </button>

            <p className="settings-label">آخرین حمایت‌های مالی</p>
            {donationsError && (
              <p className="landing-recent-donations-fallback">فهرست دونیت‌ها فعلاً در دسترس نیست.</p>
            )}
            {!donationsError && !donations && <p className="landing-recent-donations-loading">در حال بارگذاری…</p>}
            {donations && donations.length === 0 && !donationsError && (
              <p className="landing-recent-donations-fallback">هنوز دونیتی ثبت نشده — اولین نفر باش!</p>
            )}
            {donations && donations.length > 0 && (
              <ul className="landing-recent-donations-list">
                {donations.map((d, i) => (
                  <li key={i} className="landing-recent-donation">
                    <I.IconHeart size={14} />
                    <span className="landing-recent-donation-amount">{Number(d.amount).toLocaleString('fa-IR')} تومان</span>
                    <span className="landing-recent-donation-project">برای FontWoW</span>
                    {d.date && <span className="landing-recent-donation-date">{d.date}</span>}
                  </li>
                ))}
              </ul>
            )}

            <p className="settings-label">اهداف بعدی</p>
            <p className="donate-text">
              فونت‌هایی که در نوبت خریدن هستن، به‌ترتیب اولویت — با کمک شما زودتر آزاد می‌شن.
              قیمت نهایی هر لایسنس نامحدود با تخفیف اختصاصی فونت‌ایران محاسبه شده.
            </p>
            <FontGoals strings={t} />

            <p className="settings-label">مشارکت‌کنندگان</p>
            {contributorsError && (
              <p className="landing-contributors-fallback">
                فهرست مشارکت‌کنندگان فعلاً در دسترس نیست — <a href={`${REPO_URL}/graphs/contributors`} target="_blank" rel="noreferrer">مشاهده در گیت‌هاب</a>
              </p>
            )}
            {!contributorsError && !contributors && <p className="landing-contributors-loading">در حال بارگذاری…</p>}
            {contributors && contributors.length > 0 && (
              <div className="landing-contributors-grid">
                {contributors.map((c) => (
                  <a key={c.id} className="landing-contributor" href={c.html_url} target="_blank" rel="noreferrer">
                    <img src={c.avatar_url} alt={c.login} width="56" height="56" loading="lazy" />
                    <span>{c.login}</span>
                    <small>{c.contributions} کامیت</small>
                  </a>
                ))}
              </div>
            )}

            <p className="settings-label">حامیان رسانه‌ای</p>
            <p className="donate-text">از همراهانی که FontWoW را به مخاطبان بیشتری معرفی می‌کنند، صمیمانه سپاسگزاریم.</p>
            <MediaSupporters compact />

            <p className="settings-label">لینک‌ها</p>
            <a className="sheet-item" href="https://t.me/FontWoW" target="_blank" rel="noreferrer">
              <I.IconTelegram size={17} style={{ color: '#229ed9' }} /> کانال رسمی تلگرام (@FontWoW)
            </a>
            <a className="sheet-item" href="https://t.me/+IAzR2ntpvNVkMWI0" target="_blank" rel="noreferrer">
              <I.IconTelegram size={17} style={{ color: '#229ed9' }} /> گروه گفتگو و ثبت نظرات
            </a>
            <a className="sheet-item" href={REPO_URL} target="_blank" rel="noreferrer">
              <I.IconGithub size={17} /> کد متن‌باز در گیت‌هاب
            </a>
            <a className="sheet-item" href="https://fonts.google.com/attribution" target="_blank" rel="noreferrer">
              <I.IconExternal size={17} /> فونت‌ها از Google Fonts
            </a>
          </div>
        </Sheet>
      )}

      {showDiagnostics && (
        <Sheet title={t('diagnosticsTitle')} tall onClose={() => setShowDiagnostics(false)}>
          <div className="diagnostics-container" dir={appSettings.lang === 'fa' ? 'rtl' : 'ltr'}>
            
            {/* System Health Summary Card */}
            <div className={`status-card ${systemHealth.hasError ? 'red' : systemHealth.hasWarning ? 'yellow' : 'green'}`}>
              <div className="status-card-header">
                <h3>{t('systemStatus')}</h3>
                <span className="status-badge">
                  {systemHealth.hasError ? t('systemErrors') : systemHealth.hasWarning ? t('systemWarnings') : t('systemHealthy')}
                </span>
              </div>
              
              {systemHealth.issues.length > 0 && (
                <div className="issues-list">
                  {systemHealth.issues.map((issue) => (
                    <div key={issue.id} className={`issue-item ${issue.severity}`}>
                      <div className="issue-content">
                        <span className={`issue-dot ${issue.severity}`} />
                        <span>{appSettings.lang === 'fa' ? issue.message : issue.messageEn}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {systemHealth.issues.some(i => i.recoverable) && (
                <button
                  className="sheet-item recommended auto-fix-btn"
                  style={{ marginTop: '14px', marginBottom: 0, width: '100%' }}
                  onClick={() => {
                    const fixed = logger.autoFix()
                    setSystemHealth(logger.checkHealth())
                    if (fixed.length > 0) {
                      setToast(t('fixSuccess'))
                    }
                  }}
                >
                  <I.IconSparkles size={17} />
                  <span>{t('runAutoFix')}</span>
                </button>
              )}
            </div>

            {/* Status Metrics Grid */}
            <p className="settings-label">{appSettings.lang === 'fa' ? 'جزئیات وضعیت سیستم' : 'System Components Status'}</p>
            <div className="status-grid">
              <div className="status-item">
                <span className={`status-dot ${systemHealth.status.localStorage}`} />
                <span>{t('localStorageStatus')}</span>
              </div>
              <div className="status-item">
                <span className={`status-dot ${systemHealth.status.network}`} />
                <span>{t('networkStatus')}</span>
              </div>
              <div className="status-item">
                <span className={`status-dot ${systemHealth.status.customFonts}`} />
                <span>{t('customFontsStatus')}</span>
              </div>
              <div className="status-item">
                <span className={`status-dot ${systemHealth.status.browserCapabilities}`} />
                <span>{t('browserCapabilities')}</span>
              </div>
            </div>

            {/* Event Logs Console */}
            <div className="logs-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', marginBottom: '8px' }}>
              <p className="settings-label" style={{ margin: 0 }}>{t('logsList')}</p>
              <div className="logs-actions" style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="icon-btn-text"
                  onClick={() => {
                    const logsText = logs.map(l => `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] [${l.action}] ${l.message} ${l.details ? `\nDetails: ${l.details}` : ''}`).join('\n')
                    navigator.clipboard.writeText(logsText)
                    setToast(appSettings.lang === 'fa' ? 'لاگ‌ها کپی شدند' : 'Logs copied')
                  }}
                  title={t('copyLogs')}
                >
                  <I.IconCopy size={14} />
                  <span style={{ fontSize: '12px', marginRight: '4px', marginLeft: '4px' }}>{t('copyLogs')}</span>
                </button>
                <button
                  className="icon-btn-text"
                  onClick={() => {
                    logger.clearLogs()
                  }}
                  title={t('clearLogs')}
                >
                  <I.IconTrash size={14} />
                  <span style={{ fontSize: '12px', marginRight: '4px', marginLeft: '4px' }}>{t('clearLogs')}</span>
                </button>
              </div>
            </div>

            {/* Log Search and Filter */}
            <input
              type="text"
              className="text-input"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder={t('searchLogsPlaceholder')}
              style={{ marginBottom: '12px' }}
            />

            <div className="log-filters" style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { key: 'all', label: t('allLogs') },
                { key: 'info', label: t('infoLogs') },
                { key: 'warn', label: t('warnLogs') },
                { key: 'error', label: t('errorLogs') }
              ].map(f => (
                <button
                  key={f.key}
                  className={`filter-chip ${filterLevel === f.key ? 'active' : ''}`}
                  onClick={() => setFilterLevel(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Logs Console Scroll Box */}
            <div className="logs-console">
              {logs.filter(l => {
                const matchesLevel = filterLevel === 'all' || l.level === filterLevel
                const matchesSearch = !logSearch || 
                  l.message.toLowerCase().includes(logSearch.toLowerCase()) || 
                  l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                  (l.details && l.details.toLowerCase().includes(logSearch.toLowerCase()))
                return matchesLevel && matchesSearch
              }).length === 0 ? (
                <p className="no-logs-msg">{t('noLogs')}</p>
              ) : (
                logs.filter(l => {
                  const matchesLevel = filterLevel === 'all' || l.level === filterLevel
                  const matchesSearch = !logSearch || 
                    l.message.toLowerCase().includes(logSearch.toLowerCase()) || 
                    l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                    (l.details && l.details.toLowerCase().includes(logSearch.toLowerCase()))
                  return matchesLevel && matchesSearch
                }).map(l => (
                  <div
                    key={l.id}
                    className={`log-entry ${l.level} ${expandedLogId === l.id ? 'expanded' : ''}`}
                    onClick={() => setExpandedLogId(expandedLogId === l.id ? null : l.id)}
                  >
                    <div className="log-entry-meta">
                      <span className="log-time">
                        {new Date(l.timestamp).toLocaleTimeString(appSettings.lang === 'fa' ? 'fa-IR' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </span>
                      <span className="log-action">{l.action}</span>
                      <span className={`log-badge ${l.level}`}>{l.level}</span>
                    </div>
                    <div className="log-message">{l.message}</div>
                    {l.details && expandedLogId === l.id && (
                      <pre className="log-detail-pre">{l.details}</pre>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        </Sheet>
      )}

      {exportLoading && (
        <div className="export-loading-overlay" role="status" aria-live="polite">
          <div className="export-loading-card">
            <div className="export-spinner-ring">
              <I.IconSparkles size={22} className="export-spinner-icon" />
            </div>
            <h4 className="export-loading-title">{t('save')}</h4>
            <p className="export-loading-msg">{exportLoading.message || t('exportingImage')}</p>
          </div>
        </div>
      )}

      {toast && (() => {
        const toastObj = typeof toast === 'string' ? { text: toast, type: 'success' } : toast
        const isError = toastObj.type === 'error'
        return (
          <div className={`toast ${isError ? 'toast-error' : 'toast-success'}`} key={toastObj.text || toast}>
            {isError ? <I.ToastError size={19} /> : <I.ToastCheck size={19} />}
            <span>{toastObj.text || toast}</span>
          </div>
        )
      })()}

      {promptState && (
        <PromptSheet
          title={t(promptState.promptKey)}
          initialValue={promptState.initialText}
          placeholder={t('placeholder')}
          submitLabel={promptState.promptKey === 'editLabelText' ? (t('save')) : (t('save'))}
          cancelLabel={t('clear')}
          onSubmit={handlePromptSubmit}
          onClose={() => setPromptState(null)}
        />
      )}

      {availableUpdate ? (
        <div className="update-banner">
          <div className="update-banner-text">
            <strong>{t('updateAvailable')} v{availableUpdate.version}</strong>
            {availableUpdate.changes.length > 0 && (
              <ul>
                {availableUpdate.changes.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="update-banner-actions">
            {availableUpdate.downloadUrl && (
              <a
                className="update-banner-download"
                href={availableUpdate.downloadUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t('updateDownload')}
              </a>
            )}
            <button
              className="update-banner-dismiss"
              onClick={() => {
                dismissUpdate(availableUpdate.version)
                setAvailableUpdate(null)
              }}
            >
              <I.IconX size={15} />
            </button>
          </div>
        </div>
      ) : showIOSPrompt ? (
        <div className="update-banner ios-prompt-banner">
          <div className="update-banner-text" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="ios-share-badge">
              <I.IconShare size={20} />
            </div>
            <div>
              <strong style={{ display: 'block', margin: 0 }}>{appSettings.lang === 'fa' ? 'نصب اپلیکیشن' : 'Install App'}</strong>
              <span style={{ fontSize: '12.5px', lineHeight: '1.5', display: 'block', marginTop: '3px' }}>
                {appSettings.lang === 'fa' 
                  ? 'روی آیفون/آیپد هستی؟ برای تجربه‌ی بهتر، دکمه‌ی اشتراک‌گذاری (Share) در پایین مرورگر را بزنید و «Add to Home Screen» را انتخاب کنید.' 
                  : 'On iOS? Tap the Share button in your browser and select "Add to Home Screen" to install.'}
              </span>
            </div>
          </div>
          <div className="update-banner-actions">
            <button
              className="update-banner-dismiss"
              onClick={() => {
                localStorage.setItem('fontwow_dismissed_ios_prompt', 'true')
                setShowIOSPrompt(false)
              }}
            >
              <I.IconX size={15} />
            </button>
          </div>
        </div>
      ) : null}

      <footer className="footer">
        <a href="https://github.com/FontWoW/FontWoW.github.io" target="_blank" rel="noreferrer">
          {t('openSource')} <I.IconExternal size={11} className="flip-rtl" />
        </a>
      </footer>
    </div>
  )
}
