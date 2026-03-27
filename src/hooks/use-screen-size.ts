import { useEffect, useState } from "react"

const BREAKPOINTS: Record<string, number> = {
  sm:  640,
  md:  768,
  lg:  1024,
  xl:  1280,
  "2xl": 1536,
}

export default function useScreenSize() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  )

  useEffect(() => {
    const handle = () => setWidth(window.innerWidth)
    window.addEventListener("resize", handle)
    return () => window.removeEventListener("resize", handle)
  }, [])

  return {
    width,
    lessThan: (bp: string) => width < (BREAKPOINTS[bp] ?? 0),
  }
}
