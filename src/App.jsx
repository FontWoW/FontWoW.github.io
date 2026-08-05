import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { toPng, toBlob } from 'html-to-image'
import { isNative, saveImageNative, copyImageNative, copyTextNative } from './native'
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
import { useProjectPersistence } from './db/useProjectPersistence'
import './App.css'

const SETTINGS_KEY = 'fontwow_settings_v1'
const CUSTOM_FONTS_KEY = 'fontwow_custom_fonts_v1'
const CUSTOM_TEMPLATES_KEY = 'fontwow_custom_templates_v1'
const APP_SETTINGS_KEY = 'fontwow_app_settings_v1'
const DONATE_URL = '' // لینک درگاه پرداخت زیبال رو اینجا قرار بده

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

function SliderRow({ label, value, display, min, max, step, onChange, onGestureStart, onGestureEnd }) {
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
        onPointerDown={onGestureStart}
        onPointerUp={onGestureEnd}
        onPointerCancel={onGestureEnd}
        onBlur={onGestureEnd}
      />
      <span className="val">{display ?? value}</span>
    </div>
  )
}

export default function App() {
  const [cssElement, setCssElement] = useState('h1')
  // Design state starts as defaults; event-sourced draft hydrates from IndexedDB.
  const [state, setState] = useState(() => ({ ...defaultState }))
  const [appSettings, setAppSettings] = useState(() => ({
    ...defaultAppSettings,
    ...loadJSON(APP_SETTINGS_KEY, {}),
  }))
  const [tab, setTab] = useState('font')
  const [fontLang, setFontLang] = useState('fa')
  const [bgCategory, setBgCategory] = useState('colors')
  const [showSave, setShowSave] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showDonate, setShowDonate] = useState(false)
  const [fontSuggestion, setFontSuggestion] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [customFonts, setCustomFonts] = useState(() => loadJSON(CUSTOM_FONTS_KEY, []))
  const [customTemplates, setCustomTemplates] = useState(() => loadJSON(CUSTOM_TEMPLATES_KEY, []))
  const [showStyleStudio, setShowStyleStudio] = useState(false)
  const [styleName, setStyleName] = useState('')
  const [toast, setToast] = useState('')
  const [activeCanvasTool, setActiveCanvasTool] = useState(null)
  const previewRef = useRef(null)
  const textRef = useRef(null)
  const tabsRef = useRef(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const onHydrateState = useCallback((next) => {
    setState({ ...defaultState, ...next })
    // contentEditable is uncontrolled for caret UX — sync DOM text on load
    if (textRef.current) textRef.current.innerText = next.text ?? ''
  }, [])

  const {
    gallery: saved,
    saveToGallery: persistGalleryProject,
    openProject,
    removeFromGallery,
    beginGesture,
    endGesture,
  } = useProjectPersistence({
    defaultState,
    onHydrateState,
    getState: () => stateRef.current,
    state,
  })

  const t = (key) => STRINGS[appSettings.lang]?.[key] ?? STRINGS.fa[key] ?? key

  // Sliders only persist on finger/mouse release (not on every tick)
  const AppSliderRow = useCallback(
    (props) => (
      <SliderRow
        {...props}
        onGestureStart={beginGesture}
        onGestureEnd={endGesture}
      />
    ),
    [beginGesture, endGesture],
  )

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

  useEffect(() => {
    if (!toast) return
    const tm = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(tm)
  }, [toast])

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings))
  }, [appSettings])

  useEffect(() => {
    document.documentElement.dir = appSettings.lang === 'en' ? 'ltr' : 'rtl'
    document.documentElement.lang = appSettings.lang
  }, [appSettings.lang])

  useEffect(() => {
    customFonts.forEach((f) => {
      const face = new FontFace(f.family.replace(/'/g, ''), `url(${f.dataUrl})`)
      face
        .load()
        .then((loaded) => document.fonts.add(loaded))
        .catch(() => {})
    })
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

  function loadFont(f) {
    if (!f || f.dataUrl || loadedFontIds.has(f.id)) return Promise.resolve()
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
      // Google Fonts can be blocked/throttled by some Android carriers/DNS —
      // without a timeout a blocked request never fires onerror and the UI hangs forever
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
  }

  useEffect(() => {
    loadFont(font)
  }, [font])

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

  async function onUploadBgImage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await fileToDataUrl(file)
      update({ bgId: 'custom-image', customBgUrl: dataUrl })
      setToast(t('bgAdded'))
    } catch {
      setToast(t('bgError'))
    }
  }

  function removeBgImage(e) {
    e.stopPropagation()
    update({ customBgUrl: null, bgId: 'grad-1' })
  }

  function update(patch) {
    setState((s) => ({ ...s, ...patch }))
  }

  function onTextInput(e) {
    update({ text: e.currentTarget.innerText })
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
    beginGesture()
    const startX = e.clientX
    const origWidth = layer.width
    function onMove(ev) {
      const width = Math.min(600, Math.max(30, origWidth + (ev.clientX - startX)))
      updateLayer(layer.id, { width })
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      endGesture() // one IndexedDB event with final size
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  function updateLayer(id, patch) {
    setState((s) => ({
      ...s,
      layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }))
  }

  function deleteLayer(id) {
    update({
      layers: state.layers.filter((l) => l.id !== id),
      activeLayerId: null,
    })
  }

  function handleLayerDrag(e, layer) {
    e.stopPropagation()
    beginGesture()
    update({ activeLayerId: layer.id })
    if (!previewRef.current) {
      endGesture()
      return
    }
    const rect = previewRef.current.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const origX = layer.x
    const origY = layer.y
    function onMove(ev) {
      const dx = ((ev.clientX - startX) / rect.width) * 100
      const dy = ((ev.clientY - startY) / rect.height) * 100
      updateLayer(layer.id, {
        x: Math.min(95, Math.max(5, origX + dx)),
        y: Math.min(95, Math.max(5, origY + dy)),
      })
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      endGesture() // one event with final position
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  function handleLayerRotate(e, layer) {
    e.stopPropagation()
    const layerEl = e.currentTarget.closest('.text-layer')
    if (!layerEl) return
    beginGesture()
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
      window.removeEventListener('pointercancel', onUp)
      endGesture() // one event with final rotation
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
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
    textShadow: state.shadow ? '0 4px 18px rgba(0,0,0,0.55), 0 1px 0 rgba(0,0,0,0.3)' : 'none',
    WebkitTextStroke: state.stroke ? `${state.strokeWidth}px ${strokeColor}` : 'none',
    position: 'relative',
    zIndex: 1,
    ...effectStyle,
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
      setToast(t('imageSaved'))
    } catch (err) {
      console.error('exportPng failed:', err)
      setToast(errorToast('imageError', err))
    }
    setShowSave(false)
  }

  async function copyImage() {
    if (!previewRef.current) return
    try {
      await ensureFontPainted()
      if (isNative()) {
        const dataUrl = await toPng(previewRef.current, { pixelRatio: 3, cacheBust: true })
        const mode = await copyImageNative(dataUrl, `fontwow-${Date.now()}.png`)
        // 'canceled' means the user dismissed the share sheet — say nothing.
        if (mode !== 'canceled') setToast(t(mode === 'shared' ? 'imageShared' : 'imageCopied'))
      } else {
        const blob = await toBlob(previewRef.current, { pixelRatio: 3, cacheBust: true })
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
        setToast(t('imageCopied'))
      }
    } catch (err) {
      console.error('copyImage failed:', err)
      try {
        if (isNative()) await copyTextNative(state.text)
        else await navigator.clipboard.writeText(state.text)
        setToast(t('imageCopyFallback'))
      } catch {
        setToast(t('copyFailed'))
      }
    }
    setShowSave(false)
  }

  async function copyText() {
    try {
      if (isNative()) await copyTextNative(state.text)
      else await navigator.clipboard.writeText(state.text)
      setToast(t('textCopied'))
    } catch {
      setToast(t('copyFailed'))
    }
    setShowSave(false)
  }

  async function saveToGallery() {
    if (!state.text.trim()) {
      setToast(t('writeFirst'))
      return
    }
    try {
      // Event-sourced gallery project (project.created + full state payload)
      await persistGalleryProject()
      setToast(t('savedToGallery'))
      setShowSave(false)
    } catch (err) {
      console.error('saveToGallery failed:', err)
      setToast(errorToast('imageError', err))
    }
  }

  async function loadEntry(entry) {
    try {
      // Replay the project's event log into a new draft and hydrate the editor
      await openProject(entry.id)
      setShowGallery(false)
    } catch (err) {
      console.error('loadEntry failed:', err)
      setToast(errorToast('imageError', err))
    }
  }

  async function deleteEntry(id, e) {
    e.stopPropagation()
    try {
      await removeFromGallery(id)
    } catch (err) {
      console.error('deleteEntry failed:', err)
      setToast(errorToast('imageError', err))
    }
  }

  function clearAll() {
    setState({ ...defaultState })
    if (textRef.current) textRef.current.innerText = ''
    textRef.current?.focus()
  }

  const ALIGN_ORDER = ['right', 'center', 'left']
  function cycleAlign() {
    const next = ALIGN_ORDER[(ALIGN_ORDER.indexOf(state.align) + 1) % ALIGN_ORDER.length]
    update({ align: next })
  }

  function toggleCanvasTool(tool) {
    setActiveCanvasTool((cur) => (cur === tool ? null : tool))
  }

  function resetAppSettings() {
    localStorage.removeItem(SETTINGS_KEY)
    localStorage.removeItem(APP_SETTINGS_KEY)
    localStorage.removeItem(CUSTOM_FONTS_KEY)
    window.location.reload()
  }

  const TABS = [
    { id: 'font', label: t('tabFont'), Icon: I.IconType },
    { id: 'style', label: t('tabStyle'), Icon: I.IconSparkles },
    { id: 'box', label: t('tabBox'), Icon: I.IconSquare },
    { id: 'color', label: t('tabColor'), Icon: I.IconPalette },
    { id: 'bg', label: t('tabBg'), Icon: I.IconImage },
    { id: 'layout', label: t('tabLayout'), Icon: I.IconSliders },
    { id: 'templates', label: t('tabTemplates'), Icon: I.IconGrid },
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
            update({ activeLayerId: null })
            setShowSave(true)
          }}
        >
          <I.IconDownload size={14} /> {t('save')}
        </button>
        <div className="brand">
          <I.Logo size={22} />
          <span className="brand-name">FontWoW</span>
        </div>
        <div className="header-actions">
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
            <I.IconImages size={14} /> {t('gallery')}
          </button>
        </div>
      </header>

      <main className="stage">
        <div
          className="stage-inner"
          ref={previewRef}
          style={previewStyle}
          onClick={() => state.activeLayerId && update({ activeLayerId: null })}
        >
          <div className="bg-layer" style={bgLayerStyle} />
          <div
            className="text-canvas"
            ref={textRef}
            style={textStyle}
            contentEditable
            suppressContentEditableWarning
            data-placeholder={t('placeholder')}
            onInput={onTextInput}
          />
          {state.layers.map((layer) => {
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
                  const val = window.prompt(t('editLayerText'), layer.text)
                  if (val != null) updateLayer(layer.id, { text: val })
                }}
              >
                {layer.text}
                {state.activeLayerId === layer.id && (
                  <>
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
        <button className="add-layer-btn" onClick={addLayer} aria-label={t('addLayer')}>
          <I.IconPlus size={12} /> Aa
        </button>
        <label className="add-layer-btn add-image-layer-btn" aria-label={t('addSticker')}>
          <input type="file" accept="image/*" onChange={onUploadLayerImage} hidden />
          <I.IconPlus size={12} /> <I.IconImage size={13} />
        </label>
        {state.text && (
          <>
            <div className="canvas-rail">
              <button
                className={`rail-btn ${activeCanvasTool === 'size' ? 'on' : ''}`}
                onClick={() => toggleCanvasTool('size')}
                aria-label={t('size')}
              >
                <I.IconTextSize size={16} />
              </button>
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
            {activeCanvasTool === 'size' && (
              <div className="canvas-size-slider">
                <span className="val">{state.fontSize}</span>
                <input
                  type="range"
                  min="16"
                  max="120"
                  value={state.fontSize}
                  onChange={(e) => update({ fontSize: +e.target.value })}
                  orient="vertical"
                />
              </div>
            )}
          </>
        )}
      </main>

      <section className="controls">
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
                    {f.dataUrl && (
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
                <AppSliderRow
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
                <AppSliderRow
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
                <AppSliderRow
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
                <AppSliderRow
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

          {tab === 'layout' && (
            <div className="layout-panel">
              <AppSliderRow
                label={t('size')}
                min={16}
                max={120}
                value={state.fontSize}
                onChange={(e) => update({ fontSize: +e.target.value })}
              />
              <AppSliderRow
                label={t('letterSpacing')}
                min={-4}
                max={20}
                value={state.letterSpacing}
                onChange={(e) => update({ letterSpacing: +e.target.value })}
              />
              <AppSliderRow
                label={t('lineHeight')}
                min={0.8}
                max={2.4}
                step={0.1}
                value={state.lineHeight}
                onChange={(e) => update({ lineHeight: +e.target.value })}
              />
              <AppSliderRow
                label={t('strokeWidth')}
                min={0.5}
                max={6}
                step={0.5}
                value={state.strokeWidth}
                onChange={(e) => update({ strokeWidth: +e.target.value })}
              />
              <AppSliderRow
                label={t('opacity')}
                min={10}
                max={100}
                value={state.opacity}
                display={`${state.opacity}%`}
                onChange={(e) => update({ opacity: +e.target.value })}
              />
              <AppSliderRow
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
          {DONATE_URL ? (
            <a
              className="sheet-item recommended"
              href={DONATE_URL}
              target="_blank"
              rel="noreferrer"
            >
              <I.IconCreditCard size={17} /> {t('payViaZibal')}
            </a>
          ) : (
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
          <a className="sheet-item" href="#/about">
            <I.IconDownload size={17} /> معرفی برنامه و دانلود اندروید
          </a>

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

          <p className="settings-label">{t('version')}: 1.0.0</p>
          <button className="sheet-item" onClick={resetAppSettings}>
            <I.IconRefresh size={17} /> {t('resetSettings')}
          </button>
        </Sheet>
      )}

      {toast && (
        <div className="toast" key={toast}>
          <I.ToastCheck size={19} />
          <span>{toast}</span>
        </div>
      )}

      <footer className="footer">
        <a href="https://github.com/FontWoW/FontWoW.github.io" target="_blank" rel="noreferrer">
          {t('openSource')} <I.IconExternal size={11} className="flip-rtl" />
        </a>
      </footer>
    </div>
  )
}
