'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { SpiralAnimation } from '@/components/SpiralAnimation'

const BUTTON_DELAY = 4000 // ms — button doesn't exist in DOM until this elapses

interface LandingPageProps {
  onDismiss?: () => void
  onReady?: () => void
}

export default function LandingPage({ onDismiss, onReady }: LandingPageProps) {
  const [visible, setVisible] = useState(true)
  const [buttonReady, setButtonReady] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const uiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onReady?.()
  }, [onReady])

  // Mount button into the DOM only after 4s — not clickable before that
  useEffect(() => {
    const id = setTimeout(() => setButtonReady(true), BUTTON_DELAY)
    return () => clearTimeout(id)
  }, [])

  const handleOpen = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        onDismiss?.()
        setVisible(false)
      },
    })

    // 1. Fade UI out first
    tl.to(uiRef.current, {
      opacity: 0,
      y: -24,
      duration: 0.45,
      ease: 'power2.in',
    })

    // 2. While UI is fading, start galaxy zoom-out/fade
    tl.to(
      overlayRef.current,
      {
        opacity: 0,
        scale: 1.08,
        duration: 0.9,
        ease: 'power3.inOut',
      },
      0.25
    )
  }

  if (!visible) return null

  return (
    <div
      ref={overlayRef}
      id="landing-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* ── Spiral galaxy canvas ── */}
      <SpiralAnimation />

      {/* ── Ambient vignette ── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(16,14,12,0.55) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* ── UI layer ── */}
      <div
        ref={uiRef}
        id="landing-ui"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Button only mounts after BUTTON_DELAY — zero interactivity before that */}
        {buttonReady && <OpenButton onOpen={handleOpen} />}
      </div>
    </div>
  )
}

// ── Button mounts fresh, immediately runs its entrance animation ──────────────
function OpenButton({ onOpen }: { onOpen: () => void }) {
  const onMount = (el: HTMLButtonElement | null) => {
    if (!el) return

    // Starts invisible+below — animates in immediately on mount (delay handled by parent)
    gsap.set(el, { opacity: 0, y: 16 })

    gsap.timeline()
      .to(el, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
      // blink 1 — slow sine wave dip
      .to(el, { opacity: 0.25, duration: 0.6, ease: 'sine.inOut' })
      .to(el, { opacity: 1, duration: 0.6, ease: 'sine.inOut' })
      // blink 2
      .to(el, { opacity: 0.25, duration: 0.6, ease: 'sine.inOut' })
      .to(el, { opacity: 1, duration: 0.6, ease: 'sine.inOut' })
      // blink 3
      .to(el, { opacity: 0.25, duration: 0.6, ease: 'sine.inOut' })
      .to(el, { opacity: 1, duration: 0.6, ease: 'sine.inOut' })
  }

  return (
    <button
      ref={onMount}
      id="open-btn"
      onClick={onOpen}
      aria-label="Enter the website"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem 1rem',
        pointerEvents: 'auto',
        fontFamily: 'var(--font-geist-sans), sans-serif',
        fontSize: 'clamp(1rem, 1.8vw, 1.3rem)',
        fontWeight: 500,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color: '#8c7f74',
        transition: 'color 0.25s ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = '#f2ede8')}
      onMouseLeave={e => (e.currentTarget.style.color = '#8c7f74')}
    >
      Open
    </button>
  )
}
