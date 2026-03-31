"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ScrambleToggleProps {
  texts: [string, string]       // two texts to toggle between
  scrambleSpeed?: number        // ms between scramble frames
  maxIterations?: number        // scramble frames before snapping to target
  className?: string            // applied to revealed / resting chars
  scrambledClassName?: string   // applied to chars mid-scramble
  onStart?: (target: string) => void  // called immediately when scramble begins
  onToggle?: () => void               // called after each transition completes
}

export default function ScrambleToggle({
  texts,
  scrambleSpeed   = 50,
  maxIterations   = 8,
  className,
  scrambledClassName,
  onStart,
  onToggle,
}: ScrambleToggleProps) {
  const [phase,       setPhase]       = useState(0)
  const [displayText, setDisplayText] = useState(texts[0])
  const [scrambling,  setScrambling]  = useState(false)

  const rafRef   = useRef<number | null>(null)
  const phaseRef = useRef(0)

  // Char pool: unique printable chars from both texts combined — memoized so
  // the Set/filter computation only runs when the texts prop actually changes
  const charPoolValues = useMemo(
    () => [...new Set([...texts[0].split(""), ...texts[1].split("")])].filter((c) => c !== " "),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [texts[0], texts[1]]
  )
  const charPool = useRef(charPoolValues)
  charPool.current = charPoolValues

  const trigger = () => {
    if (rafRef.current !== null) return

    const nextPhase = (phaseRef.current + 1) % 2
    const target    = texts[nextPhase]
    const sourceLen = texts[phaseRef.current].length
    const targetLen = target.length
    let   iteration = 0
    let   lastTime  = 0

    setScrambling(true)

    // Fire synchronously before first frame so caller can fit font-size
    // to target text before any scramble chars are rendered
    onStart?.(target)

    const tick = (now: number) => {
      if (now - lastTime >= scrambleSpeed) {
        lastTime = now
        iteration++

        if (iteration >= maxIterations) {
          rafRef.current = null
          setDisplayText(target)
          setScrambling(false)
          phaseRef.current = nextPhase
          setPhase(nextPhase)
          onToggle?.()
          return
        }

        // Gradually interpolate displayed char count from source → target length.
        // This prevents a hard jump in width when the two texts differ in length.
        const progress   = iteration / maxIterations
        const currentLen = Math.round(sourceLen + (targetLen - sourceLen) * progress)
        const pool       = charPool.current

        setDisplayText(
          Array.from({ length: currentLen }, () =>
            pool[Math.floor(Math.random() * pool.length)]
          ).join("")
        )
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <span
      onMouseEnter={trigger}
      style={{ display: "inline-block", cursor: "default" }}
      className={cn("select-none", className)}
    >
      <span className="sr-only">{texts[phase]}</span>

      <span aria-hidden="true">
        {displayText.split("").map((char, i) => (
          <span
            key={i}
            className={scrambling ? scrambledClassName : className}
          >
            {char}
          </span>
        ))}
      </span>
    </span>
  )
}
