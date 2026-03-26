"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface ScrambleHoverProps {
  text: string
  scrambleSpeed?: number
  maxIterations?: number
  sequential?: boolean
  revealDirection?: "start" | "end" | "center"
  useOriginalCharsOnly?: boolean
  characters?: string
  className?: string
  scrambledClassName?: string
}

export default function ScrambleHover({
  text,
  scrambleSpeed = 50,
  maxIterations = 10,
  useOriginalCharsOnly = false,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
  className,
  scrambledClassName,
  sequential = false,
  revealDirection = "start",
}: ScrambleHoverProps) {
  const [displayText, setDisplayText] = useState(text)
  const [isHovering, setIsHovering] = useState(false)
  const [isScrambling, setIsScrambling] = useState(false)

  // useRef — NOT useState — so mutations never re-trigger the effect
  const revealedRef  = useRef(new Set<number>())
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Clear any previous interval immediately
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    const availableChars = useOriginalCharsOnly
      ? [...new Set(text.split(""))].filter((c) => c !== " ")
      : characters.split("")

    // Build a display frame: revealed chars show the real char, others scramble
    const makeFrame = (): string =>
      text
        .split("")
        .map((char, i) => {
          if (char === " ") return " "
          if (revealedRef.current.has(i)) return text[i]
          return availableChars[Math.floor(Math.random() * availableChars.length)]
        })
        .join("")

    // Which index to reveal next (forward direction)
    const nextForward = (): number => {
      const len = text.length
      switch (revealDirection) {
        case "end":
          return len - 1 - revealedRef.current.size
        case "center": {
          const mid = Math.floor(len / 2)
          const off = Math.floor(revealedRef.current.size / 2)
          const idx =
            revealedRef.current.size % 2 === 0 ? mid + off : mid - off - 1
          if (idx >= 0 && idx < len && !revealedRef.current.has(idx)) return idx
          for (let i = 0; i < len; i++) if (!revealedRef.current.has(i)) return i
          return 0
        }
        default: // "start"
          return revealedRef.current.size
      }
    }

    // Which index to un-reveal next (reverse direction — mirrors forward)
    const nextReverse = (): number => {
      if (revealedRef.current.size === 0) return -1
      const indices = [...revealedRef.current]
      switch (revealDirection) {
        case "end":
          return Math.min(...indices)
        case "center":
          return indices[indices.length - 1]
        default: // "start" — reverse from the last revealed
          return Math.max(...indices)
      }
    }

    if (isHovering) {
      revealedRef.current.clear()
      setIsScrambling(true)

      if (sequential) {
        intervalRef.current = setInterval(() => {
          if (revealedRef.current.size < text.length) {
            revealedRef.current.add(nextForward())
            setDisplayText(makeFrame())
          } else {
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            setIsScrambling(false)
            setDisplayText(text)
          }
        }, scrambleSpeed)
      } else {
        let iteration = 0
        intervalRef.current = setInterval(() => {
          iteration++
          setDisplayText(makeFrame())
          if (iteration >= maxIterations) {
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            setIsScrambling(false)
            setDisplayText(text)
          }
        }, scrambleSpeed)
      }
    } else {
      // ── Reverse animation on hover-exit ──
      if (sequential && revealedRef.current.size > 0) {
        setIsScrambling(true)
        intervalRef.current = setInterval(() => {
          const idx = nextReverse()
          if (idx === -1) {
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            setIsScrambling(false)
            setDisplayText(text)
            return
          }
          revealedRef.current.delete(idx)
          setDisplayText(makeFrame())
        }, scrambleSpeed * 0.75) // slightly faster reversal
      } else {
        setIsScrambling(false)
        setDisplayText(text)
        revealedRef.current.clear()
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  // Only re-run when hover state changes — refs don't need to be in deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovering])

  return (
    <motion.span
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      className={cn("inline-block cursor-default select-none", className)}
    >
      {/* Accessible label always reads the real text */}
      <span className="sr-only">{text}</span>

      {/* Visual render, char by char */}
      <span aria-hidden="true">
        {displayText.split("").map((char, i) => (
          <span
            key={i}
            className={cn(
              !isScrambling || revealedRef.current.has(i)
                ? className
                : scrambledClassName
            )}
          >
            {char}
          </span>
        ))}
      </span>
    </motion.span>
  )
}
