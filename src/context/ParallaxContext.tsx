'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { PARALLAX_RETURN_SCROLL_KEY } from '@/lib/parallax/navigation'

export type TransitionPhase = 'idle' | 'entering' | 'exiting'

interface ParallaxContextType {
  isParallaxOpen: boolean
  transitionPhase: TransitionPhase
  toggleParallax: () => void
}

const ParallaxContext = createContext<ParallaxContextType | undefined>(undefined)

// Enter: overlay covers page at ~500ms → navigate → scanline → boot → reveal → idle at 2000ms
// Exit:  overlay covers page at ~400ms → navigate → compress → line blink → idle at 1200ms
const ENTER_NAVIGATE_MS = 500
const ENTER_IDLE_MS     = 1700
const EXIT_NAVIGATE_MS  = 400
const EXIT_IDLE_MS      = 1200

export function ParallaxProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isParallaxOpen = pathname === '/parallax'
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('idle')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const schedule = (ms: number, fn: () => void) => {
    const id = setTimeout(fn, ms)
    timers.current.push(id)
  }

  const toggleParallax = useCallback(() => {
    clearTimers()

    if (isParallaxOpen) {
      setTransitionPhase('exiting')
      schedule(EXIT_NAVIGATE_MS, () => router.push('/', { scroll: false }))
      schedule(EXIT_IDLE_MS, () => setTransitionPhase('idle'))
    } else {
      try {
        window.sessionStorage.setItem(PARALLAX_RETURN_SCROLL_KEY, String(window.scrollY))
      } catch {}
      setTransitionPhase('entering')
      schedule(ENTER_NAVIGATE_MS, () => router.push('/parallax', { scroll: false }))
      schedule(ENTER_IDLE_MS, () => setTransitionPhase('idle'))
    }
  }, [isParallaxOpen, router])

  // Keyboard shortcut — P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return
      if (
        (e.key === 'p' || e.key === 'P') &&
        !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey
      ) {
        e.preventDefault()
        toggleParallax()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleParallax])

  useEffect(() => () => clearTimers(), [])

  return (
    <ParallaxContext.Provider value={{ isParallaxOpen, transitionPhase, toggleParallax }}>
      {children}
    </ParallaxContext.Provider>
  )
}

export function useParallax() {
  const context = useContext(ParallaxContext)
  if (!context) throw new Error('useParallax must be used within ParallaxProvider')
  return context
}
