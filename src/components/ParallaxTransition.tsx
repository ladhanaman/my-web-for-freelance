'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useParallax } from '@/context/ParallaxContext'

// ─── Internal animation step sequencer ───────────────────────────────────────
//
// Enter (main → parallax):
//   0ms    enter_expand  — overlay expands from center (scaleY: 0 → 1)
//   600ms  enter_reveal  — overlay fades out, parallax shows
//   1300ms → idle
//
// Exit (parallax → main):
//   0ms    exit_overlay  — overlay fades in over parallax page
//   450ms  exit_compress — overlay scaleY collapses to nothing
//   750ms  → idle
//
type Step =
  | 'idle'
  | 'enter_expand'
  | 'enter_reveal'
  | 'exit_overlay'
  | 'exit_compress'

export function ParallaxTransition() {
  const { transitionPhase } = useParallax()
  const [step, setStep] = useState<Step>('idle')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const after = (ms: number, fn: () => void) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
  }

  useEffect(() => {
    clear()

    if (transitionPhase === 'entering') {
      setStep('enter_expand')
      after(600,  () => setStep('enter_reveal'))
      after(1300, () => setStep('idle'))
    } else if (transitionPhase === 'exiting') {
      setStep('exit_overlay')
      after(450, () => setStep('exit_compress'))
      after(750, () => setStep('idle'))
    } else {
      setStep('idle')
    }

    return clear
  }, [transitionPhase])

  if (step === 'idle') return null

  const isEntering = step === 'enter_expand' || step === 'enter_reveal'
  const isExiting  = step === 'exit_overlay' || step === 'exit_compress'

  const overlayFadingOut = step === 'enter_reveal'
  const isCompressed     = step === 'exit_compress'

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden">

      {/* ── Enter: expand from center → fade out ─────────────────────────────── */}
      {isEntering && (
        <motion.div
          key="enter-overlay"
          className="absolute inset-0 bg-[#050e07]"
          style={{ transformOrigin: 'center' }}
          initial={{ scaleY: 0, opacity: 1 }}
          animate={{
            scaleY: 1,
            opacity: overlayFadingOut ? 0 : 1,
          }}
          transition={{
            scaleY:  { duration: 0.52, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: overlayFadingOut ? 0.65 : 0, ease: 'easeInOut' },
          }}
        >
          <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(to_bottom,rgba(143,234,162,0.15)_1px,transparent_1px)] [background-size:100%_4px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_center,rgba(143,234,162,0.06),transparent)]" />
        </motion.div>
      )}

      {/* ── Exit: fade in → compress to nothing ──────────────────────────────── */}
      {isExiting && (
        <motion.div
          key="exit-overlay"
          className="absolute inset-0 bg-[#050e07]"
          style={{ transformOrigin: 'center' }}
          initial={{ opacity: 0, scaleY: 1 }}
          animate={{
            opacity: 1,
            scaleY: isCompressed ? 0 : 1,
          }}
          transition={{
            opacity: { duration: 0.42, ease: 'easeInOut' },
            scaleY:  { duration: 0.30, ease: [0.4, 0, 0.2, 1] },
          }}
        >
          <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(to_bottom,rgba(143,234,162,0.15)_1px,transparent_1px)] [background-size:100%_4px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_center,rgba(143,234,162,0.06),transparent)]" />
        </motion.div>
      )}
    </div>
  )
}
