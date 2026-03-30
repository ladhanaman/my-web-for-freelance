'use client'

import { useEffect, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { LANDING_DISMISSED_SESSION_KEY } from '@/lib/home-entry'

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
  try {
    isDismissed = window.sessionStorage.getItem(LANDING_DISMISSED_SESSION_KEY) === '1'
  } catch {
    isDismissed = false
  }

  return JSON.stringify({
    hash,
    shouldRenderOverlay: !hasHash && !isDismissed,
  })
}

export default function LandingPageWrapper() {
  const snapshot = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
  const isResolved = snapshot !== 'pending'
  const { hash, shouldRenderOverlay } = isResolved
    ? (JSON.parse(snapshot) as { hash: string; shouldRenderOverlay: boolean })
    : { hash: '', shouldRenderOverlay: false }

  useEffect(() => {
    if (!isResolved || shouldRenderOverlay) return

    hidePlaceholder()

    if (hash.length > 1) {
      const targetId = decodeHashTargetId(hash)
      if (targetId) {
        scrollToHashTarget(targetId)
      }
    }
  }, [hash, isResolved, shouldRenderOverlay])

  const handleReady = () => {
    hidePlaceholder()
  }

  const handleDismiss = () => {
    try {
      window.sessionStorage.setItem(LANDING_DISMISSED_SESSION_KEY, '1')
    } catch {
      // Ignore storage failures; the overlay will simply reappear on the next visit.
    }
  }

  if (!isResolved || !shouldRenderOverlay) return null

  return <LandingPage onReady={handleReady} onDismiss={handleDismiss} />
}
