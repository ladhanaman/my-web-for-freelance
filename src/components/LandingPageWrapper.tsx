'use client'

import { useEffect, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { LANDING_DISMISSED_SESSION_KEY, SITE_ENTERED_EVENT } from '@/lib/home-entry'
import { PARALLAX_RETURN_SCROLL_KEY } from '@/lib/parallax/navigation'

// dynamic + ssr:false must live in a Client Component — not a Server Component
const LandingPage = dynamic(() => import('@/components/LandingPage'), { ssr: false })

const HASH_SCROLL_MAX_ATTEMPTS = 12

function hidePlaceholder() {
  const placeholder = document.getElementById('landing-placeholder')

  if (!placeholder) return

  placeholder.style.display = 'none'
}

function decodeHashTargetId(hash: string): string | null {
  if (!hash.startsWith('#') || hash.length <= 1) return null

  try {
    const id = decodeURIComponent(hash.slice(1))
    return id || null
  } catch {
    return null
  }
}

function scrollToHashTarget(id: string, attempt = 0) {
  const target = document.getElementById(id)
  if (target) {
    target.scrollIntoView({ behavior: 'auto', block: 'start' })
    return
  }

  if (attempt >= HASH_SCROLL_MAX_ATTEMPTS) return

  window.requestAnimationFrame(() => {
    scrollToHashTarget(id, attempt + 1)
  })
}

const subscribe = () => () => {}

const getServerSnapshot = () => 'pending'

function getClientSnapshot() {
  const hash = window.location.hash
  const hasHash = hash.length > 1

  let isDismissed = false
  let hasParallaxReturnScroll = false
  try {
    isDismissed = window.sessionStorage.getItem(LANDING_DISMISSED_SESSION_KEY) === '1'
    hasParallaxReturnScroll = window.sessionStorage.getItem(PARALLAX_RETURN_SCROLL_KEY) !== null
  } catch {
    isDismissed = false
    hasParallaxReturnScroll = false
  }

  return JSON.stringify({
    hash,
    shouldHoldPlaceholder: hasParallaxReturnScroll,
    shouldRenderOverlay: !hasHash && !isDismissed,
  })
}

export default function LandingPageWrapper() {
  const snapshot = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
  const isResolved = snapshot !== 'pending'
  const { hash, shouldHoldPlaceholder, shouldRenderOverlay } = isResolved
    ? (JSON.parse(snapshot) as {
        hash: string
        shouldHoldPlaceholder: boolean
        shouldRenderOverlay: boolean
      })
    : { hash: '', shouldHoldPlaceholder: false, shouldRenderOverlay: false }

  useEffect(() => {
    if (!isResolved || shouldRenderOverlay || shouldHoldPlaceholder) return

    hidePlaceholder()
    // Overlay was skipped (hash nav, repeat visit, etc.) — signal the rest of the
    // page that the user has effectively "entered" so heavy assets can mount.
    window.dispatchEvent(new CustomEvent(SITE_ENTERED_EVENT))

    if (hash.length > 1) {
      const targetId = decodeHashTargetId(hash)
      if (targetId) {
        scrollToHashTarget(targetId)
      }
    }
  }, [hash, isResolved, shouldHoldPlaceholder, shouldRenderOverlay])

  const handleReady = () => {
    hidePlaceholder()
  }

  const handleDismiss = () => {
    try {
      window.sessionStorage.setItem(LANDING_DISMISSED_SESSION_KEY, '1')
    } catch {
      // Ignore storage failures; the overlay will simply reappear on the next visit.
    }
    window.dispatchEvent(new CustomEvent(SITE_ENTERED_EVENT))
  }

  if (!isResolved || !shouldRenderOverlay) return null

  return <LandingPage onReady={handleReady} onDismiss={handleDismiss} />
}
