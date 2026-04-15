'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function ParallaxTransition() {
  const pathname = usePathname()
  const overlayRef = useRef<HTMLDivElement>(null)
  const isMounted = useRef(false)

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }

    const overlay = overlayRef.current
    if (!overlay) {
      return
    }

    overlay.style.opacity = '1'

    const timeout1 = window.setTimeout(() => {
      overlay.style.opacity = '0'
    }, 300)

    return () => {
      window.clearTimeout(timeout1)
    }
  }, [pathname])

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000',
        opacity: 0,
        transition: 'opacity 300ms ease-in-out',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      aria-hidden="true"
    />
  )
}
