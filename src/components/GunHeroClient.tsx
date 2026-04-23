"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { LANDING_DISMISSED_SESSION_KEY, SITE_ENTERED_EVENT } from "@/lib/home-entry"

// ssr: false must live inside a Client Component per Next.js 16
const GunHero = dynamic(() => import("./GunHero"), { ssr: false })

interface GunHeroClientProps {
  hdrSrc: string
  glbSrc: string
}

export default function GunHeroClient({ hdrSrc, glbSrc }: GunHeroClientProps) {
  const [shouldMount, setShouldMount] = useState(false)

  useEffect(() => {
    // Repeat visit: overlay was already dismissed in this session → mount immediately
    let isDismissed = false
    try {
      isDismissed = window.sessionStorage.getItem(LANDING_DISMISSED_SESSION_KEY) === "1"
    } catch {}

    if (isDismissed) {
      setShouldMount(true)
      return
    }

    // First visit: defer Canvas until overlay dismissal (or any skip-overlay path)
    const onEntered = () => setShouldMount(true)
    window.addEventListener(SITE_ENTERED_EVENT, onEntered, { once: true })
    return () => window.removeEventListener(SITE_ENTERED_EVENT, onEntered)
  }, [])

  if (!shouldMount) return null

  return <GunHero hdrSrc={hdrSrc} glbSrc={glbSrc} />
}
