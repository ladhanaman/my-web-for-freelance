import { useSyncExternalStore } from "react"

const BREAKPOINTS: Record<string, number> = {
  sm:  640,
  md:  768,
  lg:  1024,
  xl:  1280,
  "2xl": 1536,
}

export default function useScreenSize() {
  const width = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => undefined
      }

      window.addEventListener("resize", onStoreChange)
      return () => window.removeEventListener("resize", onStoreChange)
    },
    () => window.innerWidth,
    () => 1024
  )

  return {
    width,
    lessThan: (bp: string) => width < (BREAKPOINTS[bp] ?? 0),
  }
}
