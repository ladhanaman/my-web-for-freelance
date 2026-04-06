'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function BlogTransition() {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const isMounted = useRef(false)

  useEffect(() => {
    // Skip the initial mount — only trigger on actual navigation
    if (!isMounted.current) {
      isMounted.current = true
      return
    }

    // Detect route changes and trigger transition
    setIsTransitioning(true)
    setShowOverlay(true)

    // Fade out current page (300ms)
    const timeout1 = setTimeout(() => {
      setShowOverlay(false)
    }, 300)

    // Clean up transition state (300ms later)
    const timeout2 = setTimeout(() => {
      setIsTransitioning(false)
    }, 600)

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
    }
  }, [pathname])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        opacity: showOverlay ? 1 : 0,
        transition: 'opacity 300ms ease-in-out',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      aria-hidden="true"
    />
  )
}
