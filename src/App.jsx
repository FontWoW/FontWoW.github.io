import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { toPng, toBlob } from 'html-to-image'
import { isNative, saveImageNative, shareFileNative, copyImageNative, copyTextNative, openExternalUrl } from './native'
import {
  FONTS,
  FONT_CATEGORIES,
  BACKGROUNDS,
  BG_CATEGORIES,
  BG_TEMPLATES,
  ALL_BACKGROUNDS,
  TEXT_BOX_STYLES,
  TEXT_COLORS,
  THEME_COLORS,
  googleFontsUrlForFont,
  TEXT_EFFECTS,
  TEXT_GRADIENTS,
  ASPECT_RATIOS,
  TEMPLATES,
} from './fonts'
import * as I from './icons'
import { STRINGS } from './strings'
import { LABEL_ASSETS, LabelArtwork } from './labels'
import { useDesignHistory } from './useDesignHistory'
import googleFontsList from './google-fonts.json'
import { UPDATES, APP_VERSION } from './updates'
import { checkForUpdate, dismissUpdate } from './updateCheck'
import { FEATURES } from './features'
import PromptSheet from './PromptSheet'
import MediaSupporters from './MediaSupporters'
import FontGoals from './FontGoals'
import logger from './logger'
import './App.css'
import './Landing.css'

const STORAGE_KEY = 'fontwow_saved_v1'
const SETTINGS_KEY = 'fontwow_settings_v1'
const CUSTOM_FONTS_KEY = 'fontwow_custom_fonts_v1'
const CUSTOM_TEMPLATES_KEY = 'fontwow_custom_templates_v1'
const APP_SETTINGS_KEY = 'fontwow_app_settings_v1'
const DONATE_URL = 'https://daramet.com/fontwow'
const CRYPTO_DONATE_URL = 'https://pay.oxapay.com/15417059'
const REPO_URL = 'https://github.com/FontWoW/FontWoW.github.io'
const CONTRIBUTORS_API = 'https://api.github.com/repos/FontWoW/FontWoW.github.io/contributors'

function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
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

function boxStyleFor(styleId, color) {
  switch (styleId) {
    case 'box':
      return {
        background: 'rgba(0,0,0,0.35)',
        padding: '10px 20px',
        borderRadius: '10px',
      }
    case 'underline':
      return { borderBottom: `4px solid ${color}`, paddingBottom: '8px' }
    case 'frame':
      return {
        border: `2px solid ${color}`,
        padding: '10px 20px',
        borderRadius: '8px',
      }
    case 'glass':
      return {
        background: 'rgba(255,255,255,0.14)',
        backdropFilter: 'blur(8px)',
        padding: '10px 20px',
        borderRadius: '14px',
      }
    default:
      return {}
  }
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
  color: '#ffffff',
  bgId: 'none',
  customBgUrl: null,
  align: 'center',
  letterSpacing: 0,
  lineHeight: 1.4,
  direction: 'rtl',
  effect: 'none',
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
  const [tab, setTab] = useState('font')
  const [fontLang, setFontLang] = useState('fa')
  const [dragGuides, setDragGuides] = useState({ x: null, y: null })
  const [bgCategory, setBgCategory] = useState('colors')
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
  const [saved, setSaved] = useState(() => loadJSON(STORAGE_KEY, []))
  const [customFonts, setCustomFonts] = useState(() => loadJSON(CUSTOM_FONTS_KEY, []))
  const [customTemplates, setCustomTemplates] = useState(() => loadJSON(CUSTOM_TEMPLATES_KEY, []))
  const [showStyleStudio, setShowStyleStudio] = useState(false)
  const [styleName, setStyleName] = useState('')
  const [showLabelPicker, setShowLabelPicker] = useState(false)
  const [toast, setToast] = useState('')
  const [availableUpdate, setAvailableUpdate] = useState(null)
  const [showGoogleFontsSearch, setShowGoogleFontsSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [promptState, setPromptState] = useState(null)
  const [isExportingGif, setIsExportingGif] = useState(false)
  const [isExportingVideo, setIsExportingVideo] = useState(false)
  const previewRef = useRef(null)
  const textRef = useRef(null)
  const tabsRef = useRef(null)

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

  const t = useCallback((key) => STRINGS[appSettings.lang]?.[key] ?? STRINGS.fa[key] ?? key, [appSettings.lang])

  const allFonts = useMemo(() => [...FONTS, ...customFonts], [customFonts])
  const visibleFonts = useMemo(
    () => allFonts.filter((f) => f.dataUrl || f.lang === fontLang),
    [allFonts, fontLang]
  )
  const font = useMemo(
    () => allFonts.find((f) => f.id === state.fontId) ?? allFonts[0],
    [allFonts, state.fontId]
  )
  const bg = useMemo(
    () => ALL_BACKGROUNDS.find((b) => b.id === state.bgId) ?? ALL_BACKGROUNDS[0],
    [state.bgId]
  )
  const allTemplates = useMemo(() => [...TEMPLATES, ...customTemplates], [customTemplates])
  const activeLabel = state.layers.find((layer) => layer.id === state.activeLayerId && layer.type === 'label')
  const activeTextLayer = state.layers.find((layer) => layer.id === state.activeLayerId && layer.type === 'text')
  const editableFontSize = activeTextLayer?.fontSize ?? state.fontSize

  useEffect(() => {
    if (!toast) return
    const tm = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(tm)
  }, [toast])

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
        if (!cancelled) setContributors(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setContributorsError(true)
      })
    return () => { cancelled = true }
  }, [showAbout, contributors, contributorsError])

  useEffect(() => {
    if (!showAbout || donations || donationsError) return
    let cancelled = false
    fetch('/donations.json')
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

  useLayoutEffect(() => {
    function place() {
      const wrap = tabsRef.current
      if (!wrap) return
      const btn = wrap.querySelector('.tab.active')
      const ind = wrap.querySelector('.tab-indicator')
      if (!btn || !ind) return
      ind.style.width = `${btn.offsetWidth}px`
      ind.style.transform = `translateX(${btn.offsetLeft}px)`
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
    place()
    document.fonts?.ready?.then(place)
  }, [tab, appSettings.lang])

  const [loadedFontIds, setLoadedFontIds] = useState(() => new Set())
  const [loadingFontId, setLoadingFontId] = useState(null)

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
      setToast(t('fontError'))
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
    if (!f || f.dataUrl || loadedFontIds.has(f.id)) return Promise.resolve()
    
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
    if (!url) return Promise.resolve()
    setLoadingFontId(f.id)
    return new Promise((resolve) => {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = url
      let settled = false
      const fail = () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        link.remove()
        setLoadingFontId((id) => (id === f.id ? null : id))
        setToast(t('fontError'))
        resolve()
      }
      const timer = setTimeout(fail, 8000)
      link.onload = () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        setLoadedFontIds((prev) => new Set(prev).add(f.id))
        setLoadingFontId((id) => (id === f.id ? null : id))
        resolve()
      }
      link.onerror = fail
      document.head.appendChild(link)
    })
  }, [loadedFontIds, loadFontNative, t])

  useEffect(() => {
    loadFont(font)
  }, [font, loadFont])

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
      setToast(t('fontError'))
    }
  }

  function deleteCustomFont(id, e) {
    e.stopPropagation()
    const next = customFonts.filter((f) => f.id !== id)
    setCustomFonts(next)
    localStorage.setItem(CUSTOM_FONTS_KEY, JSON.stringify(next))
    if (state.fontId === id) update({ fontId: 'vazirmatn' })
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
      setToast(t('bgError'))
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
      setToast(t('bgError'))
    }
  }

  function removeBgImage(e) {
    e.stopPropagation()
    update({ customBgUrl: null, bgId: 'grad-1' })
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
      setToast(t('backgroundRemoveFailed'))
    }
  }

  function addLabel(asset) {
    const id = `label-${Date.now()}`
    const newLayer = {
      id,
      type: 'label',
      templateId: asset.id,
      text: t('newLabelText'),
      x: 50,
      y: 50,
      rotation: 0,
      width: asset.width,
      aspectRatio: asset.aspectRatio,
      color: '#8b5cf6',
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
      setToast(t('bgError'))
    }
  }

  function handleLayerResize(e, layer) {
    e.stopPropagation()
    const startX = e.clientX
    const origWidth = layer.width
    function onMove(ev) {
      const width = Math.min(600, Math.max(30, origWidth + (ev.clientX - startX)))
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
    }
  }

  function saveCustomTemplate() {
    if (!styleName.trim()) {
      setToast(t('nameFirst'))
      return
    }
    const entry = buildStyleFromCurrentState(styleName.trim(), `custom-${Date.now()}`)
    const next = [...customTemplates, entry]
    setCustomTemplates(next)
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(next))
    setToast(t('styleSaved'))
    setStyleName('')
  }

  async function copyStyleJSON() {
    if (!styleName.trim()) {
      setToast(t('nameFirst'))
      return
    }
    const entry = buildStyleFromCurrentState(styleName.trim(), `t-${Date.now()}`)
    const json = JSON.stringify(entry, null, 2)
    try {
      if (isNative()) await copyTextNative(json)
      else await navigator.clipboard.writeText(json)
      setToast(t('styleJSONCopied'))
    } catch {
      setToast(t('copyFailed'))
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
  if (state.effect === 'gradient') {
    const grad = TEXT_GRADIENTS.find((g) => g.id === state.textGradient) ?? TEXT_GRADIENTS[0]
    effectStyle = {
      backgroundImage: grad.css,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
    }
  } else if (state.effect === 'neon') {
    effectStyle = {
      textShadow: `0 0 6px ${state.color}, 0 0 14px ${state.color}, 0 0 28px ${state.color}, 0 0 48px ${state.color}`,
    }
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
    ...effectStyle,
    textShadow: [effectStyle.textShadow, baseShadow, depthShadow !== 'none' ? depthShadow : ''].filter(Boolean).join(', ') || 'none',
    ...boxStyleFor(state.textBoxStyle, state.color),
    ...(state.textBoxStyle !== 'none'
      ? {
          width: 'fit-content',
          maxWidth: '100%',
          marginInlineStart: state.align !== 'left' ? 'auto' : 0,
          marginInlineEnd: state.align !== 'right' ? 'auto' : 0,
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

  const ratio = ASPECT_RATIOS.find((r) => r.id === state.aspectRatio)?.value ?? null

  const previewStyle = {
    padding: `${state.margin}px`,
    position: 'relative',
    ...(ratio
      ? {
          flex: '0 0 auto',
          width: 'auto',
          height: '100%',
          aspectRatio: ratio,
        }
      : {}),
  }

  const bgLayerStyle = {
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

  async function ensureFontPainted() {
    await loadFont(font)
    try {
      await document.fonts?.load(`${state.fontSize}px ${font.family}`)
    } catch {}
    await document.fonts?.ready
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  }

  // Native failures are invisible without logcat, so surface the real reason in the toast.
  function errorToast(key, err) {
    const detail = err?.message || String(err ?? '')
    return detail ? `${t(key)}: ${detail.slice(0, 120)}` : t(key)
  }

  async function exportPng() {
    if (!previewRef.current) return
    const fileName = `fontwow-${Date.now()}.png`
    logger.info('Export', 'شروع استخراج تصویر PNG')
    logger.preflightCheck('export_png')
    try {
      await ensureFontPainted()
      const dataUrl = await toPng(previewRef.current, { pixelRatio: 3, cacheBust: true })
      if (isNative()) {
        await saveImageNative(dataUrl, fileName)
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
      setToast(errorToast('imageError', err))
    }
    setShowSave(false)
  }

  async function exportGif() {
    if (!previewRef.current || isExportingGif) return
    setIsExportingGif(true)
    setShowSave(false)
    const node = previewRef.current
    try {
      await ensureFontPainted()
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
      const encoder = GIFEncoder()
      const frameCanvas = document.createElement('canvas')
      const width = Math.max(320, Math.round(node.getBoundingClientRect().width))
      const height = Math.max(180, Math.round(node.getBoundingClientRect().height))
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
        await shareFileNative(bytesToBase64(bytes), fileName)
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
      setToast(errorToast('gifError', error))
    } finally {
      clearAnimationProgress(node)
      setIsExportingGif(false)
    }
  }

  async function exportVideo() {
    if (!previewRef.current || isExportingVideo) return
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      setToast(t('videoUnsupported'))
      return
    }
    setIsExportingVideo(true)
    setShowSave(false)
    const node = previewRef.current
    try {
      await ensureFontPainted()
      const frameCanvas = document.createElement('canvas')
      const width = Math.max(320, Math.round(node.getBoundingClientRect().width))
      const height = Math.max(180, Math.round(node.getBoundingClientRect().height))
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
        await shareFileNative(bytesToBase64(new Uint8Array(await video.arrayBuffer())), fileName)
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
      setToast(errorToast('videoError', error))
    } finally {
      clearAnimationProgress(node)
      setIsExportingVideo(false)
    }
  }

  async function copyImage() {
    if (!previewRef.current) return
    logger.info('Clipboard', 'شروع کپی تصویر در کلیپ‌بورد')
    logger.preflightCheck('copy_image')
    try {
      await ensureFontPainted()
      if (isNative()) {
        const dataUrl = await toPng(previewRef.current, { pixelRatio: 3, cacheBust: true })
        const mode = await copyImageNative(dataUrl, `fontwow-${Date.now()}.png`)
        // 'canceled' means the user dismissed the share sheet — say nothing.
        if (mode !== 'canceled') {
          logger.info('Clipboard', `تصویر با حالت ${mode} کپی یا اشتراک‌گذاری شد.`)
          setToast(t(mode === 'shared' ? 'imageShared' : 'imageCopied'))
        } else {
          logger.info('Clipboard', 'عملیات کپی/اشتراک‌گذاری تصویر توسط کاربر لغو شد.')
        }
      } else {
        const blob = await toBlob(previewRef.current, { pixelRatio: 3, cacheBust: true })
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
        logger.info('Clipboard', 'تصویر با موفقیت در کلیپ‌بورد کپی شد.')
        setToast(t('imageCopied'))
      }
    } catch (err) {
      logger.error('Clipboard', 'خطا در کپی تصویر', err.stack || err.message)
      console.error('copyImage failed:', err)
      try {
        if (isNative()) await copyTextNative(state.text)
        else await navigator.clipboard.writeText(state.text)
        logger.info('Clipboard', 'حالت پشتیبان: متن جایگزین کپی شد.')
        setToast(t('imageCopyFallback'))
      } catch {
        logger.error('Clipboard', 'حالت پشتیبان کپی متن نیز با خطا مواجه شد.')
        setToast(t('copyFailed'))
      }
    }
    setShowSave(false)
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
      setToast(t('copyFailed'))
    }
    setShowSave(false)
  }

  function saveToGallery() {
    if (!state.text.trim()) {
      setToast(t('writeFirst'))
      return
    }
    logger.info('Gallery', 'ذخیره در گالری برنامه')
    logger.preflightCheck('save_gallery')
    const entry = { ...state, id: `${Date.now()}` }
    const next = [entry, ...saved].slice(0, 40)
    setSaved(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    logger.info('Gallery', `طرح با شناسه ${entry.id} در گالری داخلی برنامه ذخیره شد.`)
    setToast(t('savedToGallery'))
    setShowSave(false)
  }

  function loadEntry(entry) {
    commitState({ ...defaultState, ...entry })
    if (textRef.current) textRef.current.innerText = entry.text
    setShowGallery(false)
  }

  function deleteEntry(id, e) {
    e.stopPropagation()
    const next = saved.filter((s) => s.id !== id)
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
    localStorage.removeItem(SETTINGS_KEY)
    localStorage.removeItem(APP_SETTINGS_KEY)
    localStorage.removeItem(CUSTOM_FONTS_KEY)
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
    { id: 'color', label: t('tabColor'), Icon: I.IconPalette },
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

  const bgSwatches = bgCategory === 'colors' ? BACKGROUNDS : (BG_TEMPLATES[bgCategory] ?? [])

  return (
    <div className="app" style={{ '--accent': appSettings.themeColor }}>
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
            onClick={undo}
            aria-label={t('undo')}
            title={`${t('undo')} (Ctrl/Cmd + Z)`}
            disabled={!canUndo}
          >
            <I.IconUndo size={16} />
          </button>
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

      <main className="stage">
        <div
          className="stage-inner"
          ref={previewRef}
          style={previewStyle}
          onClick={() => state.activeLayerId && update({ activeLayerId: null }, { record: false })}
        >
          <div className="bg-layer" style={bgLayerStyle} />
          {state.warpMode === 'none' ? (
            <div
              className={`text-canvas tb-${state.textBoxStyle}`}
              ref={textRef}
              style={textStyle}
              contentEditable
              suppressContentEditableWarning
              data-placeholder={t('placeholder')}
              onInput={onTextInput}
            >{displayText}</div>
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
        </div>
        {dragGuides.x != null && (
          <div className="snap-guide snap-guide-v" style={{ left: dragGuides.x }} />
        )}
        {dragGuides.y != null && (
          <div className="snap-guide snap-guide-h" style={{ top: dragGuides.y }} />
        )}
        <button className="add-layer-btn" onClick={addLayer} aria-label={t('addLayer')}>
          <I.IconPlus size={12} /> Aa
        </button>
        <label className="add-layer-btn add-image-layer-btn" aria-label={t('addSticker')}>
          <input type="file" accept="image/*" onChange={onUploadLayerImage} hidden />
          <I.IconPlus size={12} /> <I.IconImage size={13} />
        </label>
        <button className="add-layer-btn add-label-layer-btn" onClick={() => setShowLabelPicker(true)} aria-label={t('addLabel')}>
          <I.IconTag size={13} />
        </button>
        {state.text && (
          <div className="canvas-rail">
              <button
                className="rail-btn"
                onClick={cycleAlign}
                aria-label={t(`align_${state.align}`)}
              >
                {state.align === 'right' ? (
                  <I.IconAlignRight size={16} />
                ) : state.align === 'left' ? (
                  <I.IconAlignLeft size={16} />
                ) : (
                  <I.IconAlignCenter size={16} />
                )}
              </button>
              <button
                className={`rail-btn ${state.underline ? 'on' : ''}`}
                onClick={() => update({ underline: !state.underline })}
                aria-label={t('underline')}
              >
                <I.IconUnderline size={15} />
              </button>
              <button
                className={`rail-btn ${state.direction === 'rtl' ? 'on' : ''}`}
                onClick={() =>
                  update({
                    direction: state.direction === 'rtl' ? 'ltr' : 'rtl',
                  })
                }
                aria-label="RTL"
              >
                RTL
              </button>
              <button className="rail-btn danger" onClick={clearAll} aria-label={t('clear')}>
                <I.IconTrash size={15} />
              </button>
          </div>
        )}
      </main>

      <section className="controls">
        <div className="pinned-size-row">
          {activeTextLayer && <p className="settings-label">{t('editingSelectedText')}</p>}
          <SliderRow
            label={t('size')}
            min={16}
            max={120}
            value={editableFontSize}
            onChange={(e) => updateEditableFontSize(+e.target.value)}
          />
        </div>
        <div className="tabs" ref={tabsRef}>
          <span className="tab-indicator" aria-hidden="true" />
          {TABS.map((tb) => (
            <button
              key={tb.id}
              className={`tab ${tab === tb.id ? 'active' : ''}`}
              onClick={() => setTab(tb.id)}
            >
              <tb.Icon size={14} /> {tb.label}
            </button>
          ))}
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
              <div className="chip-row sub-row">
                {FONT_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className={`pill-tab ${fontLang === c.id ? 'active' : ''}`}
                    onClick={() => setFontLang(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="chip-row">
                {visibleFonts.map((f) => (
                  <button
                    key={f.id}
                    className={`chip font-chip ${state.fontId === f.id ? 'selected' : ''} ${loadingFontId === f.id ? 'loading' : ''}`}
                    onClick={() => {
                      update({ fontId: f.id, direction: f.rtl ? 'rtl' : 'ltr' })
                      loadFont(f)
                    }}
                  >
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
                    <span style={{ fontFamily: f.family }}>{f.rtl ? 'ابر' : 'Aa'}</span>
                    <span className="chip-label">{f.label}</span>
                  </button>
                ))}
                <label className="chip font-chip upload-chip">
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={onUploadFont}
                    hidden
                  />
                  <I.IconPlus size={17} />
                  <span className="chip-label">{t('yourFont')}</span>
                </label>
                <button className="chip font-chip upload-chip" onClick={() => setShowGoogleFontsSearch(true)}>
                  <I.IconSearch size={17} />
                  <span className="chip-label">{t('addGoogleFont')}</span>
                </button>
              </div>
            </>
          )}

          {tab === 'style' && (
            <div className="style-grid">
              <button
                className={`toggle ${state.bold ? 'on' : ''}`}
                onClick={() => update({ bold: !state.bold })}
              >
                <b>B</b> {t('bold')}
              </button>
              <button
                className={`toggle ${state.italic ? 'on' : ''}`}
                onClick={() => update({ italic: !state.italic })}
              >
                <i>I</i> {t('italic')}
              </button>
              <button
                className={`toggle ${state.underline ? 'on' : ''}`}
                onClick={() => update({ underline: !state.underline })}
              >
                <u>U</u> {t('underline')}
              </button>
              <button
                className={`toggle ${state.shadow ? 'on' : ''}`}
                onClick={() => update({ shadow: !state.shadow })}
              >
                <I.IconShadow size={14} /> {t('shadow')}
              </button>
              <button
                className={`toggle ${state.stroke ? 'on' : ''}`}
                onClick={() => update({ stroke: !state.stroke })}
              >
                <I.IconCircle size={14} /> {t('stroke')}
              </button>
              <button
                className={`toggle ${state.direction === 'ltr' ? 'on' : ''}`}
                onClick={() =>
                  update({
                    direction: state.direction === 'rtl' ? 'ltr' : 'rtl',
                  })
                }
              >
                <I.IconArrowsLR size={14} /> {state.direction === 'rtl' ? 'RTL' : 'LTR'}
              </button>
            </div>
          )}

          {tab === 'style' && (
            <>
              <p className="settings-label">{t('effect')}</p>
              <div className="chip-row">
                {TEXT_EFFECTS.map((fx) => (
                  <button
                    key={fx.id}
                    className={`chip ${state.effect === fx.id ? 'selected' : ''}`}
                    onClick={() => update({ effect: fx.id })}
                  >
                    <span className="chip-label">{fx.label}</span>
                  </button>
                ))}
              </div>
              {state.effect === 'gradient' && (
                <div className="chip-row">
                  {TEXT_GRADIENTS.map((g) => (
                    <button
                      key={g.id}
                      className={`swatch ${state.textGradient === g.id ? 'selected' : ''}`}
                      style={{ background: g.css }}
                      onClick={() => update({ textGradient: g.id })}
                      title={g.label}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'magic' && (
            <div className="layout-panel magic-panel">
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
            <div className="chip-row">
              {TEXT_BOX_STYLES.map((s) => (
                <button
                  key={s.id}
                  className={`chip ${state.textBoxStyle === s.id ? 'selected' : ''}`}
                  onClick={() => update({ textBoxStyle: s.id })}
                >
                  <span className="chip-label">{s.label}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'color' && (
            <div className="chip-row">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  className={`swatch ${state.color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => update({ color: c })}
                />
              ))}
              <label className="swatch custom-swatch">
                <input
                  type="color"
                  value={state.color}
                  onChange={(e) => update({ color: e.target.value })}
                />
              </label>
            </div>
          )}

          {tab === 'bg' && (
            <>
              <div className="chip-row sub-row">
                {BG_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className={`pill-tab ${bgCategory === c.id ? 'active' : ''}`}
                    onClick={() => setBgCategory(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="chip-row">
                {bgCategory === 'colors' && state.customBgUrl && (
                  <button
                    className={`swatch bg-swatch image-swatch ${state.bgId === 'custom-image' ? 'selected' : ''}`}
                    style={{
                      backgroundImage: `url(${state.customBgUrl})`,
                    }}
                    onClick={() => update({ bgId: 'custom-image' })}
                    title={t('myImage')}
                  >
                    <span className="del-font" onClick={removeBgImage}>
                      <I.IconX size={9} />
                    </span>
                  </button>
                )}
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
                {bgCategory === 'colors' && (
                  <label className="swatch bg-swatch upload-chip" title={t('uploadImage')}>
                    <input type="file" accept="image/*" onChange={onUploadBgImage} hidden />
                    <I.IconPlus size={17} />
                  </label>
                )}
              </div>
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
            </>
          )}

          {tab === 'templates' && (
            <div className="chip-row">
              {allTemplates.map((tpl) => {
                const tplBg = ALL_BACKGROUNDS.find((b) => b.id === tpl.bgId)
                const isCustom = tpl.id.startsWith('custom-')
                return (
                  <button
                    key={tpl.id}
                    className="chip template-chip"
                    style={tplBg ? { background: tplBg.css } : undefined}
                    onClick={() => applyTemplate(tpl)}
                  >
                    {isCustom && (
                      <span className="del-font" onClick={(e) => deleteCustomTemplate(tpl.id, e)}>
                        <I.IconX size={9} />
                      </span>
                    )}
                    <span className="chip-label">{tpl.label}</span>
                  </button>
                )
              })}
              <button
                className="chip template-chip upload-chip"
                onClick={() => {
                  setStyleName('')
                  setShowStyleStudio(true)
                }}
              >
                <I.IconPlus size={17} />
                <span className="chip-label">{t('newStyle')}</span>
              </button>
            </div>
          )}

          {tab === 'assets' && (
            <div className="assets-panel">
              <p className="settings-label">{t('labelAssetsHint')}</p>
              <div className="label-asset-grid">
                {LABEL_ASSETS.map((asset) => (
                  <button key={asset.id} className="label-asset-card" onClick={() => addLabel(asset)}>
                    <LabelArtwork templateId={asset.id} />
                    <span>{t(asset.labelKey)}</span>
                  </button>
                ))}
              </div>
              {activeLabel && (
                <div className="label-editor">
                  <p className="settings-label">{t('editSelectedLabel')}</p>
                  <textarea
                    className="text-input label-text-input"
                    rows={3}
                    value={activeLabel.text}
                    onChange={(e) => updateLayer(activeLabel.id, { text: e.target.value })}
                  />
                  <p className="settings-label">{t('labelFont')}</p>
                  <div className="chip-row label-font-row">
                    {visibleFonts.map((labelFont) => (
                      <button
                        key={labelFont.id}
                        className={`chip font-chip ${activeLabel.fontId === labelFont.id ? 'selected' : ''}`}
                        onClick={() => {
                          updateLayer(activeLabel.id, { fontId: labelFont.id })
                          loadFont(labelFont)
                        }}
                      >
                        <span style={{ fontFamily: labelFont.family }}>{labelFont.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="label-color-row">
                    <label>{t('labelColor')}<input type="color" value={activeLabel.color} onChange={(e) => updateLayer(activeLabel.id, { color: e.target.value })} /></label>
                    <label>{t('labelTextColor')}<input type="color" value={activeLabel.textColor} onChange={(e) => updateLayer(activeLabel.id, { textColor: e.target.value })} /></label>
                  </div>
                  <SliderRow label={t('size')} min={12} max={56} value={activeLabel.fontSize} onChange={(e) => updateLayer(activeLabel.id, { fontSize: +e.target.value })} />
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
              <p className="settings-label">{t('aspectRatio')}</p>
              <div className="chip-row">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.id}
                    className={`chip ${state.aspectRatio === r.id ? 'selected' : ''}`}
                    onClick={() => update({ aspectRatio: r.id })}
                  >
                    <span className="chip-label">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {showSave && (
        <Sheet title={t('save')} onClose={() => setShowSave(false)}>
          <button className="sheet-item recommended" onClick={exportPng}>
            <I.IconDownload size={17} /> {t('saveToDevice')}
          </button>
          <button className="sheet-item" onClick={exportGif} disabled={isExportingGif}>
            <I.IconSparkles size={17} /> {isExportingGif ? t('gifExporting') : t('saveAnimatedGif')}
          </button>
          <button className="sheet-item" onClick={exportVideo} disabled={isExportingVideo}>
            <I.IconDownload size={17} /> {isExportingVideo ? t('videoExporting') : t('saveAnimatedVideo')}
          </button>
          <button className="sheet-item" onClick={copyImage}>
            <I.IconCopy size={17} /> {t('copyImageBtn')}
          </button>
          <button className="sheet-item" onClick={copyText}>
            <I.IconType size={17} /> {t('copyTextBtn')}
          </button>
          <button className="sheet-item" onClick={saveToGallery}>
            <I.IconStar size={17} /> {t('saveToAppGallery')}
          </button>
        </Sheet>
      )}

      {showLabelPicker && (
        <Sheet title={t('labelAssets')} onClose={() => setShowLabelPicker(false)}>
          <div className="label-asset-grid">
            {LABEL_ASSETS.map((asset) => (
              <button key={asset.id} className="label-asset-card" onClick={() => addLabel(asset)}>
                <LabelArtwork templateId={asset.id} />
                <span>{t(asset.labelKey)}</span>
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
              const f = allFonts.find((x) => x.id === entry.fontId) ?? allFonts[0]
              const b = ALL_BACKGROUNDS.find((x) => x.id === entry.bgId) ?? ALL_BACKGROUNDS[0]
              const cardStyle =
                entry.bgId === 'custom-image' && entry.customBgUrl
                  ? {
                      backgroundImage: `url(${entry.customBgUrl})`,
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
                      color: entry.color,
                      direction: entry.direction,
                      fontWeight: entry.bold ? 700 : 400,
                      fontStyle: entry.italic ? 'italic' : 'normal',
                    }}
                  >
                    {entry.text}
                  </span>
                  <button className="delete-btn" onClick={(e) => deleteEntry(entry.id, e)}>
                    <I.IconX size={11} />
                  </button>
                </div>
              )
            })}
          </div>
        </Sheet>
      )}

      {showStyleStudio && (
        <Sheet title={t('styleStudio')} onClose={() => setShowStyleStudio(false)}>
          <p className="donate-text">{t('styleStudioHint')}</p>
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
          <p className="settings-label">{t('themeColor')}</p>
          <div className="chip-row">
            {THEME_COLORS.map((c) => (
              <button
                key={c}
                className={`swatch ${appSettings.themeColor === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() =>
                  setAppSettings((s) => ({
                    ...s,
                    themeColor: c,
                  }))
                }
              />
            ))}
          </div>

          <p className="settings-label">{t('language')}</p>
          <div className="align-row">
            <button
              className={`toggle ${appSettings.lang === 'fa' ? 'on' : ''}`}
              onClick={() => setAppSettings((s) => ({ ...s, lang: 'fa' }))}
            >
              فارسی
            </button>
            <button
              className={`toggle ${appSettings.lang === 'en' ? 'on' : ''}`}
              onClick={() => setAppSettings((s) => ({ ...s, lang: 'en' }))}
            >
              English
            </button>
          </div>

          <p className="settings-label">{t('contact')}</p>
          <a
            className="sheet-item"
            href="https://github.com/FontWoW/FontWoW.github.io"
            target="_blank"
            rel="noreferrer"
          >
            <I.IconGithub size={17} /> GitHub
          </a>
          <a className="sheet-item" href="mailto:m4tinbeigi@gmail.com">
            <I.IconMail size={17} /> m4tinbeigi@gmail.com
          </a>
          <button
            className="sheet-item"
            onClick={() => {
              setShowSettings(false)
              setShowAbout(true)
            }}
          >
            <I.IconSparkles size={17} /> درباره‌ی FontWoW
          </button>
          <button
            className="sheet-item recommended"
            onClick={() => {
              setShowSettings(false)
              setShowDonate(true)
            }}
          >
            <I.IconHeart size={17} style={{ color: 'var(--accent)' }} /> {t('donate')}
          </button>
          <button
            className="sheet-item"
            onClick={() => {
              setShowSettings(false)
              setShowChangelog(true)
            }}
          >
            <I.IconStar size={17} style={{ color: 'var(--accent)' }} /> {t('whatsNew')}
          </button>
          <a
            className="sheet-item"
            href="#/share"
            onClick={() => setShowSettings(false)}
          >
            <I.IconImages size={17} style={{ color: 'var(--accent)' }} /> {t('shareKitLink')}
          </a>

          <button
            className="sheet-item"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', border: 'none', background: 'none', textAlign: 'inherit', padding: '12px 16px', color: 'inherit', cursor: 'pointer' }}
            onClick={() => {
              setShowSettings(false)
              setShowDiagnostics(true)
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <I.IconTerminal size={17} style={{ color: 'var(--accent)' }} />
              <span>{t('diagnosticsTitle')}</span>
            </div>
            <span
              className={`health-dot ${systemHealth.hasError ? 'red' : systemHealth.hasWarning ? 'yellow' : 'green'}`}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                display: 'inline-block',
                background: systemHealth.hasError ? '#ef4444' : systemHealth.hasWarning ? '#eab308' : '#22c55e',
                boxShadow: systemHealth.hasError 
                  ? '0 0 10px #ef4444' 
                  : systemHealth.hasWarning 
                    ? '0 0 10px #eab308' 
                    : '0 0 10px #22c55e'
              }}
            />
          </button>

          <p className="settings-label">{t('fontLicenses')}</p>
          <p className="donate-text">{t('fontLicensesText')}</p>
          <a
            className="sheet-item"
            href="https://fonts.google.com/attribution"
            target="_blank"
            rel="noreferrer"
          >
            <I.IconExternal size={17} /> Google Fonts Attribution
          </a>

          <p className="settings-label">{t('version')}: {APP_VERSION}</p>
          <button className="sheet-item" onClick={resetAppSettings}>
            <I.IconRefresh size={17} /> {t('resetSettings')}
          </button>
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

      {toast && (
        <div className="toast" key={toast}>
          <I.ToastCheck size={19} />
          <span>{toast}</span>
        </div>
      )}

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
        <div className="update-banner">
          <div className="update-banner-text">
            <strong>{appSettings.lang === 'fa' ? 'نصب اپلیکیشن' : 'Install App'}</strong>
            <span style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
              {appSettings.lang === 'fa' 
                ? 'روی آیفون/آیپد هستی؟ برای تجربه‌ی بهتر، دکمه‌ی Share را بزن و «Add to Home Screen» را انتخاب کن.' 
                : 'On iOS? Tap Share and select "Add to Home Screen" to install FontWoW.'}
            </span>
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
