'use client'

import { createContext, useCallback, useContext, useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { PARALLAX_RETURN_SCROLL_KEY } from '@/lib/parallax/navigation'

interface ParallaxContextType {
  isParallaxOpen: boolean
  toggleParallax: () => void
}

const ParallaxContext = createContext<ParallaxContextType | undefined>(undefined)

export function ParallaxProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isParallaxOpen = pathname === '/parallax'

  const toggleParallax = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        if (!isParallaxOpen) {
          window.sessionStorage.setItem(PARALLAX_RETURN_SCROLL_KEY, String(window.scrollY))
        }
      } catch (error) {
        console.error('[parallax-context] failed to persist scroll position:', error)
      }
    }

    router.push(isParallaxOpen ? '/' : '/parallax', { scroll: false })
  }, [isParallaxOpen, router])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if ((e.key === 'p' || e.key === 'P') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        toggleParallax()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleParallax])

  return (
    <ParallaxContext.Provider value={{ isParallaxOpen, toggleParallax }}>
      {children}
    </ParallaxContext.Provider>
  )
}

export function useParallax() {
  const context = useContext(ParallaxContext)
  if (!context) {
    throw new Error('useParallax must be used within ParallaxProvider')
  }
  return context
}
