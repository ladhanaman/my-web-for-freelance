"use client"

import { useRef, useEffect, useCallback } from "react"
import ScrambleHover from "@/components/fancy/scramble-hover"

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

const HEADLINE_TEXT = "IN-KAIROS.DEV"

export default function HeroSection() {
  const sectionRef    = useRef<HTMLDivElement>(null)
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const cellsRef      = useRef<Map<string, Cell>>(new Map())
  const rafRef        = useRef<number>(0)
  const scrollHintRef = useRef<HTMLDivElement>(null)
  const headlineRef   = useRef<HTMLHeadingElement>(null)

  // ── Font-fit: measure real rendered width, scale to viewport ─────
  useEffect(() => {
    const fit = () => {
      const h1 = headlineRef.current
      if (!h1) return

      // Inject an invisible off-screen probe to measure text width
      // at a known font-size, then scale to fill the viewport.
      const fontFamily =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--font-press-start")
          .trim() || '"Press Start 2P"'

      const probe = document.createElement("span")
      probe.textContent = HEADLINE_TEXT
      Object.assign(probe.style, {
        fontFamily:  `${fontFamily}, monospace`,
        fontSize:    "200px",
        whiteSpace:  "nowrap",
        visibility:  "hidden",
        position:    "fixed",
        top:         "-9999px",
        left:        "-9999px",
        pointerEvents: "none",
      })
      document.body.appendChild(probe)
      const probeWidth = probe.getBoundingClientRect().width
      document.body.removeChild(probe)

      if (probeWidth > 0) {
        // Fill 100 % of viewport width
        const px = Math.floor((window.innerWidth / probeWidth) * 200)
        h1.style.fontSize = `${px}px`
      }
    }

    // Run after the web font is loaded
    document.fonts.ready.then(fit)
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [])

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
      ref={sectionRef}
      style={{
        position: "relative",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // No overflow:hidden — allows seamless bleed into gun section
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
          height: "55%",
          background: "linear-gradient(to bottom, transparent, #100e0c 70%)",
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
          <ScrambleHover
            text={HEADLINE_TEXT}
            sequential
            revealDirection="start"
            scrambleSpeed={40}
            characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-."
            className="text-white"
            scrambledClassName="text-[#C07548]"
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
          }}
        >
          We Build What Others Can&apos;t.
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
