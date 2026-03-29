"use client"

import { useEffect, useState } from "react"

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)"

export function useFinePointer() {
  const [supportsFinePointer, setSupportsFinePointer] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return
    }

    const mediaQuery = window.matchMedia(FINE_POINTER_QUERY)
    const update = () => setSupportsFinePointer(mediaQuery.matches)

    update()

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update)
      return () => mediaQuery.removeEventListener("change", update)
    }

    mediaQuery.addListener(update)
    return () => mediaQuery.removeListener(update)
  }, [])

  return supportsFinePointer
}
