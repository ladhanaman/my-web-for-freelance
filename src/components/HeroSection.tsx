"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import ScrambleToggle from "@/components/fancy/scramble-toggle"

// ── Pixel trail config — grid-snapped, time-based fade ────────────
const CELL       = 45      // grid cell size in px (+50% again from 30)
const DECAY_MS   = 900     // total fade duration in ms
const TRAIL_MAX  = 120     // max active cells at once

// Warm palette matching the site's terracotta/cream tones
const PALETTE: readonly [number, number, number][] = [
  [192, 117,  72],   // terracotta
  [212, 137,  94],   // light terracotta
  [225, 158, 110],   // amber
  [242, 220, 190],   // cream highlight
]

// Smoothstep: cubic ease in-out for smooth fade
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

interface Cell {
  gx:    number
  gy:    number
  born:  number
  rgb:   readonly [number, number, number]
}

type HeroText = "IN-KAIROS.DEV" | "NAMAN-LADHA.DEV"
// The two texts that toggle on each hover interaction
const TEXTS: [HeroText, HeroText] = ["IN-KAIROS.DEV", "NAMAN-LADHA.DEV"]

const SUBHEADINGS: Record<HeroText, string> = {
  "IN-KAIROS.DEV": "I DESIGN, DEVELOP AND SHOOT CREATIVE EXPERIENCES",
  "NAMAN-LADHA.DEV": "WEB AND VISUALS, DONE RIGHT!",
}

export default function HeroSection() {
  const sectionRef    = useRef<HTMLDivElement>(null)
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const cellsRef      = useRef<Map<string, Cell>>(new Map())
  const rafRef        = useRef<number>(0)
  const scrollHintRef = useRef<HTMLDivElement>(null)
  const headlineRef   = useRef<HTMLHeadingElement>(null)
  // currentTextRef tracks which text is active so fit() measures the right string
  const [activeText, setActiveText] = useState<HeroText>(TEXTS[0])
  const currentTextRef = useRef<HeroText>(TEXTS[0])
  const [isTransitioning, setIsTransitioning] = useState(false)

  // ── Font-fit: probe the active text, scale h1 to exact viewport width ──
  const fit = useCallback((text?: string) => {
    const h1 = headlineRef.current
    if (!h1) return

    const measured = text ?? currentTextRef.current
    const fontFamily =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--font-press-start")
        .trim() || '"Press Start 2P"'

    const probe = document.createElement("span")
    probe.textContent = measured
    Object.assign(probe.style, {
      fontFamily:    `${fontFamily}, monospace`,
      fontSize:      "200px",
      whiteSpace:    "nowrap",
      visibility:    "hidden",
      position:      "fixed",
      top:           "-9999px",
      left:          "-9999px",
      pointerEvents: "none",
    })
    document.body.appendChild(probe)
    const probeWidth = probe.getBoundingClientRect().width
    document.body.removeChild(probe)

    if (probeWidth > 0) {
      const px = Math.floor((window.innerWidth / probeWidth) * 200)
      h1.style.fontSize = `${px}px`
    }
  }, [])

  // Called by ScrambleToggle the moment scramble begins — fits font-size to
  // the target text immediately so the headline width is correct during scramble
  const handleStart = useCallback((target: string) => {
    fit(target)
  }, [fit])

  // Called by ScrambleToggle after each transition completes
  const handleToggle = useCallback(() => {
    const next = TEXTS.find((t) => t !== currentTextRef.current) ?? TEXTS[0]

    // Phase 1 — fade out subtext
    setIsTransitioning(true)

    // Phase 2 — swap subtext after fade-out completes (font-size already correct)
    setTimeout(() => {
      currentTextRef.current = next
      setActiveText(next)
    }, 160)

    // Phase 3 — fade back in
    setTimeout(() => {
      setIsTransitioning(false)
    }, 210)
  }, [])

  useEffect(() => {
    document.fonts.ready.then(() => fit())
    window.addEventListener("resize", () => fit())
    return () => window.removeEventListener("resize", () => fit())
  }, [fit])

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const [key, cell] of cellsRef.current) {
      const age  = now - cell.born
      const life = Math.max(0, 1 - age / DECAY_MS)
      if (life <= 0) { cellsRef.current.delete(key); continue }

      const opacity = smoothstep(life)
      const [r, g, b] = cell.rgb
      ctx.fillStyle = `rgba(${r},${g},${b},${opacity.toFixed(3)})`
      ctx.fillRect(cell.gx * CELL, cell.gy * CELL, CELL, CELL)
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const canvas  = canvasRef.current
    if (!section || !canvas) return

    const resize = () => {
      canvas.width  = section.offsetWidth
      canvas.height = section.offsetHeight
    }
    resize()

    const addCell = (clientX: number, clientY: number) => {
      const rect = section.getBoundingClientRect()
      if (clientY < rect.top || clientY > rect.bottom) return

      const localX = clientX - rect.left
      const localY = clientY - rect.top
      const gx = Math.floor(localX / CELL)
      const gy = Math.floor(localY / CELL)
      const key = `${gx},${gy}`

      const rgb = PALETTE[Math.floor(Math.random() * PALETTE.length)]
      cellsRef.current.set(key, { gx, gy, born: performance.now(), rgb })

      if (cellsRef.current.size > TRAIL_MAX) {
        const oldest = cellsRef.current.keys().next().value
        if (oldest) cellsRef.current.delete(oldest)
      }
    }

    const onMouseMove = (e: MouseEvent) => addCell(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      for (const t of e.touches) addCell(t.clientX, t.clientY)
    }

    const onScroll = () => {
      const hint = scrollHintRef.current
      if (!hint || !section) return
      const scrolled = window.scrollY
      const halfHeight = section.offsetHeight * 0.5
      hint.style.opacity = String(Math.max(0, 1 - scrolled / halfHeight))
    }

    window.addEventListener("mousemove",  onMouseMove)
    window.addEventListener("touchmove",  onTouchMove, { passive: true })
    window.addEventListener("resize",     resize)
    window.addEventListener("scroll",     onScroll, { passive: true })
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener("mousemove",  onMouseMove)
      window.removeEventListener("touchmove",  onTouchMove)
      window.removeEventListener("resize",     resize)
      window.removeEventListener("scroll",     onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  return (
    <section
      id="home"
      ref={sectionRef}
      style={{
        position: "relative",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Pixel trail canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Bottom gradient — extended to 55% for seamless hero→gun blend */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30%",
          background: "linear-gradient(to bottom, transparent, #100e0c 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* ── Hero content ─────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          textAlign: "center",
          padding: "0 1.5rem",
        }}
      >
        {/* Full-width pixel headline — font-size set by JS after font load */}
        <h1
          ref={headlineRef}
          style={{
            fontFamily:    "var(--font-press-start), monospace",
            fontSize:      "8vw",   /* initial approximation before JS fires */
            fontWeight:    400,
            lineHeight:    1.1,
            color:         "#ffffff",
            whiteSpace:    "nowrap",
            width:         "100vw",
            marginLeft:    "calc(-50vw + 50%)",
            textAlign:     "center",
            textRendering: "optimizeSpeed",
            display:       "block",
          }}
        >
          <ScrambleToggle
            texts={TEXTS}
            scrambleSpeed={50}
            maxIterations={8}
            className="text-white"
            scrambledClassName="text-[#C07548]"
            onStart={handleStart}
            onToggle={handleToggle}
          />
        </h1>

        {/* Sub-headline — one step down in the hierarchy:
            lighter weight, tighter tracking, muted cream tone              */}
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "clamp(0.8rem, 1.35vw, 1.1rem)",
            fontWeight: 500,
            color: "#8c7f74",
            margin: "1.5rem auto 0",
            lineHeight: 1.4,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            opacity: isTransitioning ? 0 : 1,
            filter: isTransitioning ? "blur(4px)" : "blur(0px)",
            transform: isTransitioning ? "translateY(6px)" : "translateY(0px)",
            transition: "opacity 150ms ease, filter 150ms ease, transform 150ms ease",
          }}
        >
          {SUBHEADINGS[activeText]}
        </p>
      </div>

      {/* ── Scroll hint ───────────────────────────────────────────── */}
      <div
        ref={scrollHintRef}
        style={{
          position: "absolute",
          bottom: "2.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.45rem",
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#5a5048",
          }}
        >
          Scroll
        </span>
        <div className="scroll-line" />
      </div>
    </section>
  )
}
