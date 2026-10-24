import { useCallback, useEffect, useRef, useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '../icons'
import './HorizontalScroll.css'

function getScrollState(el) {
  if (!el) return { canScrollLeft: false, canScrollRight: false }
  const maxScroll = el.scrollWidth - el.clientWidth
  if (maxScroll <= 2) {
    return { canScrollLeft: false, canScrollRight: false }
  }

  const isRtl = getComputedStyle(el).direction === 'rtl'
  const sl = el.scrollLeft

  if (!isRtl) {
    return {
      canScrollLeft: sl > 4,
      canScrollRight: sl < maxScroll - 4,
    }
  }

  if (sl <= 0) {
    // Standard modern negative RTL (0 at right edge, -maxScroll at left edge)
    const current = Math.abs(sl)
    return {
      canScrollRight: current > 4,
      canScrollLeft: current < maxScroll - 4,
    }
  } else {
    // Alternate positive RTL (maxScroll at right edge, 0 at left edge)
    return {
      canScrollLeft: sl > 4,
      canScrollRight: sl < maxScroll - 4,
    }
  }
}

export default function HorizontalScroll({
  children,
  className = '',
  trackClassName = '',
  trackRef: externalRef,
  showChevrons = true,
  step = 220,
  dragSensitivity = 1,
  ariaLabel = 'محتوای افقی',
  ...props
}) {
  const containerRef = useRef(null)
  const innerRef = useRef(null)
  const trackRef = externalRef || innerRef

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const isDownRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const hasDraggedRef = useRef(false)
  const suppressClickRef = useRef(false)

  const updateScrollState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const { canScrollLeft: left, canScrollRight: right } = getScrollState(el)
    setCanScrollLeft(left)
    setCanScrollRight(right)
  }, [trackRef])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })

    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
    }
  }, [trackRef, updateScrollState])

  // Global window pointermove and pointerup so dragging is smooth and clicks on children work cleanly
  useEffect(() => {
    const onPointerMove = (e) => {
      if (!isDownRef.current) return
      const el = trackRef.current
      if (!el) return

      const deltaX = (e.clientX - startXRef.current) * dragSensitivity

      if (Math.abs(deltaX) > 6) {
        if (!hasDraggedRef.current) {
          hasDraggedRef.current = true
          suppressClickRef.current = true
          if (containerRef.current) {
            containerRef.current.classList.add('is-dragging')
          }
        }
        el.scrollLeft = scrollLeftRef.current - deltaX
      }
    }

    const onPointerUp = () => {
      if (!isDownRef.current) return
      isDownRef.current = false

      if (hasDraggedRef.current) {
        // Keep suppressClickRef true briefly so immediate click event is absorbed
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.classList.remove('is-dragging')
          }
          hasDraggedRef.current = false
          suppressClickRef.current = false
        }, 50)
      } else {
        if (containerRef.current) {
          containerRef.current.classList.remove('is-dragging')
        }
        suppressClickRef.current = false
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [dragSensitivity, trackRef])

  const scrollLeft = () => {
    if (!trackRef.current) return
    trackRef.current.scrollBy({ left: -step, behavior: 'smooth' })
  }

  const scrollRight = () => {
    if (!trackRef.current) return
    trackRef.current.scrollBy({ left: step, behavior: 'smooth' })
  }

  const handlePointerDown = (e) => {
    if (e.pointerType === 'touch') return // Let mobile browsers use native touch
    if (e.button !== 0) return // Left click only

    const tag = e.target.tagName?.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return

    const el = trackRef.current
    if (!el) return

    isDownRef.current = true
    hasDraggedRef.current = false
    suppressClickRef.current = false
    startXRef.current = e.clientX
    scrollLeftRef.current = el.scrollLeft
  }

  const handleCaptureClick = (e) => {
    if (suppressClickRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  // Wheel to horizontal scroll
  const handleWheel = (e) => {
    const el = trackRef.current
    if (!el) return
    if (e.shiftKey) return // native horizontal scroll
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return // trackpad already scrolling horizontally
    if (el.scrollWidth <= el.clientWidth) return

    e.preventDefault()
    el.scrollLeft += e.deltaY
  }

  return (
    <div
      ref={containerRef}
      className={`hz-scroll-container ${className}`}
      onClickCapture={handleCaptureClick}
      {...props}
    >
      {showChevrons && (
        <>
          <button
            type="button"
            className={`hz-scroll-chevron hz-chevron-left ${canScrollLeft ? 'visible' : ''}`}
            onClick={scrollLeft}
            tabIndex={-1}
            aria-label="اسکرول به چپ"
          >
            <IconChevronLeft size={16} />
          </button>
          <div className={`hz-scroll-fade hz-fade-left ${canScrollLeft ? 'visible' : ''}`} />

          <button
            type="button"
            className={`hz-scroll-chevron hz-chevron-right ${canScrollRight ? 'visible' : ''}`}
            onClick={scrollRight}
            tabIndex={-1}
            aria-label="اسکرول به راست"
          >
            <IconChevronRight size={16} />
          </button>
          <div className={`hz-scroll-fade hz-fade-right ${canScrollRight ? 'visible' : ''}`} />
        </>
      )}

      <div
        ref={trackRef}
        className={`hz-scroll-track ${trackClassName}`}
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        role="region"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  )
}
