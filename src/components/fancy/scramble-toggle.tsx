"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface ScrambleToggleProps {
  texts: [string, string]       // two texts to toggle between
  scrambleSpeed?: number        // ms per scramble frame
  maxIterations?: number        // scramble frames before snapping to target
  className?: string            // applied to revealed / resting chars
  scrambledClassName?: string   // applied to chars mid-scramble
  onToggle?: () => void         // called after each transition completes
}

export default function ScrambleToggle({
  texts,
  scrambleSpeed   = 50,
  maxIterations   = 8,
  className,
  scrambledClassName,
  onToggle,
}: ScrambleToggleProps) {
  const [phase,       setPhase]       = useState(0)
  const [displayText, setDisplayText] = useState(texts[0])
  const [scrambling,  setScrambling]  = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef    = useRef(0)   // mirror of phase for use inside setInterval closure

  // Char pool: unique printable chars from both texts combined
  // — same spirit as useOriginalCharsOnly but spanning both strings
  const charPool = useRef(
    [...new Set([...texts[0].split(""), ...texts[1].split("")])].filter(
      (c) => c !== " "
    )
  )

  const trigger = () => {
    // Ignore if already mid-scramble
    if (intervalRef.current) return

    const nextPhase = (phaseRef.current + 1) % 2
    const target    = texts[nextPhase]
    let   iteration = 0

    setScrambling(true)

    intervalRef.current = setInterval(() => {
      iteration++

      if (iteration >= maxIterations) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null

        // Snap to final text, advance phase
        setDisplayText(target)
        setScrambling(false)
        phaseRef.current = nextPhase
        setPhase(nextPhase)
        onToggle?.()
        return
      }

      // Each scramble frame: render target-length string of pooled chars
      // (length matches target so no layout jump when we snap)
      setDisplayText(
        target
          .split("")
          .map((char) => {
            if (char === " ") return " "
            const pool = charPool.current
            return pool[Math.floor(Math.random() * pool.length)]
          })
          .join("")
      )
    }, scrambleSpeed)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <motion.span
      onHoverStart={trigger}
      style={{ display: "inline-block", cursor: "default" }}
      className={cn("select-none", className)}
    >
      {/* Accessible label always reads the current stable text */}
      <span className="sr-only">{texts[phase]}</span>

      {/* Visual, char-by-char so scrambled chars can be coloured */}
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
    </motion.span>
  )
}
