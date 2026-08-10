import { useEffect, useRef, useState } from 'react'
import * as I from '../shared/icons'

/**
 * A lightweight modal prompt that replaces window.prompt().
 * Slides up as a bottom sheet, auto-focuses the input, and
 * calls onSubmit(value) when confirmed or onClose() when dismissed.
 */
export default function PromptSheet({
  title,
  initialValue = '',
  placeholder = '',
  submitLabel = 'OK',
  cancelLabel = 'لغو',
  onSubmit,
  onClose,
}) {
  const [value, setValue] = useState(initialValue)
  const [closing, setClosing] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    // Auto-focus with a tiny delay so the animation starts first
    const timer = setTimeout(() => inputRef.current?.focus(), 200)
    return () => clearTimeout(timer)
  }, [])

  function handleConfirm() {
    setClosing(true)
    // Let the close animation play before resolving
    setTimeout(() => onSubmit(value), 220)
  }

  function handleCancel() {
    setClosing(true)
    setTimeout(onClose, 220)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleConfirm()
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div
      className={`sheet-overlay${closing ? ' closing' : ''}`}
      onClick={handleCancel}
    >
      <div
        className={`sheet${closing ? ' closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grab">
          <span />
        </div>
        <div className="sheet-header">
          <button className="icon-btn" onClick={handleCancel} aria-label="close">
            <I.IconX size={14} />
          </button>
          <span>{title}</span>
          <span />
        </div>
        <div style={{ padding: '4px 0 20px' }}>
          <input
            ref={inputRef}
            className="text-input"
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="sheet-item recommended"
              style={{ marginBottom: 0, flex: 1, justifyContent: 'center' }}
              onClick={handleConfirm}
            >
              <I.IconStar size={16} /> {submitLabel}
            </button>
            <button
              className="sheet-item"
              style={{ marginBottom: 0, flex: 1, justifyContent: 'center' }}
              onClick={handleCancel}
            >
              <I.IconX size={16} /> {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}