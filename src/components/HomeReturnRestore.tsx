'use client'

import { useLayoutEffect } from 'react'
import { PARALLAX_RETURN_SCROLL_KEY } from '@/lib/parallax/navigation'

function hidePlaceholder() {
  const placeholder = document.getElementById('landing-placeholder')

  if (!placeholder) {
    return
  }

  placeholder.style.display = 'none'
}

function clearReturnScrollState() {
  window.sessionStorage.removeItem(PARALLAX_RETURN_SCROLL_KEY)
}

export default function HomeReturnRestore() {
  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const savedScrollY = window.sessionStorage.getItem(PARALLAX_RETURN_SCROLL_KEY)
      if (!savedScrollY) {
        return
      }

      const parsedScrollY = Number(savedScrollY)
      if (!Number.isFinite(parsedScrollY)) {
        clearReturnScrollState()
        hidePlaceholder()
        return
      }

      window.scrollTo({ top: parsedScrollY, behavior: 'auto' })

      const frameId = window.requestAnimationFrame(() => {
        clearReturnScrollState()
        hidePlaceholder()
      })

      return () => {
        window.cancelAnimationFrame(frameId)
      }
    } catch (error) {
      console.error('[home-return-restore] failed to restore parallax scroll:', error)
      clearReturnScrollState()
      hidePlaceholder()
    }
  }, [])

  return null
}
