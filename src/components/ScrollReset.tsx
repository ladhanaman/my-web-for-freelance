"use client"

import { useEffect } from "react"

export default function ScrollReset() {
  useEffect(() => {
    if (typeof window === "undefined") return
    history.scrollRestoration = "manual"
    window.scrollTo(0, 0)
  }, [])

  return null
}
