"use client"

import {
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { motion, stagger, useAnimate, useMotionValue } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import Floating, { FloatingElement } from "@/components/fancy/image/parallax-floating"
import { useFinePointer } from "@/hooks/use-fine-pointer"
import { FRAMESCAPE_HREF } from "@/lib/home-entry"
import {
  COLLECTIONS,
  GALLERY_BASE_PATH,
  SECTION_IDS,
  type Collection,
} from "@/lib/collections"
import {
  preventMediaContextMenu,
  preventMediaDragStart,
} from "@/lib/media-protection"

// ── Layout slots for collection cards — 9 total
// top/left are percentage strings relative to the section
// depth controls parallax intensity (higher = moves more)
const SLOTS = [
  // Top-left
  { top: "10%", left: "12%", rotate: "-2deg", depth: 1.05, width: "clamp(100px, 15vw, 260px)" },
  { top: "26%", left: "29%", rotate: "2deg", depth: 1.15, width: "clamp(100px, 15vw, 260px)" },
  // Top-center
  { top: "8%", left: "46%", rotate: "-1deg", depth: 0.95, width: "clamp(150px, 23vw,300px)" },
  // Top-right
  { top: "10%", left: "67%", rotate: "1deg", depth: 1.2, width: "clamp(130px, 22vw, 290px)" },
  { top: "28%", left: "80%", rotate: "-2deg", depth: 0.9, width: "clamp(100px, 15vw, 260px)" },
  // Mid-left
  { top: "50%", left: "12%", rotate: "0deg", depth: 1.1, width: "clamp(130px, 22vw, 290px)" },
  // Mid-right
  { top: "58%", left: "76%", rotate: "-1deg", depth: 1.05, width: "clamp(130px, 22vw, 290px)" },
  // Bottom-left
  { top: "71%", left: "26%", rotate: "1deg", depth: 1.0, width: "clamp(140px, 23vw, 300px)" },
  // Bottom-right
  { top: "71%", left: "60%", rotate: "-1deg", depth: 1.1, width: "clamp(130px, 22vw, 290px)" },
] as const

const HOVER_GLYPH = "[+]"
const GLYPH_FALLBACK_WIDTH = 43
const GLYPH_FALLBACK_HEIGHT = 29
const GLYPH_SAFE_INSET = 10

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

interface CollectionCardProps {
  collection: Collection
  supportsFineHover: boolean
  isActive: boolean
  onHoverChange: (slug: string | null) => void
  onNavigate: (href: string) => void
}


function CollectionCard({
  collection,
  supportsFineHover,
  isActive,
  onHoverChange,
  onNavigate,
}: CollectionCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const glyphRef = useRef<HTMLSpanElement>(null)

  const glyphX = useMotionValue(0)
  const glyphY = useMotionValue(0)

  const setMotionValue = (
    motionValue: { set: (value: number) => void; jump: (value: number) => void },
    value: number,
    snap: boolean
  ) => {
    if (snap) {
      motionValue.jump(value)
      return
    }

    motionValue.set(value)
  }

  const updateHoverTargets = (
    event: ReactPointerEvent<HTMLAnchorElement>,
    { snap = false }: { snap?: boolean } = {}
  ) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const localX = clamp(event.clientX - bounds.left, 0, bounds.width)
    const localY = clamp(event.clientY - bounds.top, 0, bounds.height)
    const glyphBounds = glyphRef.current?.getBoundingClientRect()
    const glyphWidth = glyphBounds?.width ?? GLYPH_FALLBACK_WIDTH
    const glyphHeight = glyphBounds?.height ?? GLYPH_FALLBACK_HEIGHT

    const nextGlyphX = clamp(
      localX - glyphWidth / 2,
      GLYPH_SAFE_INSET,
      Math.max(GLYPH_SAFE_INSET, bounds.width - glyphWidth - GLYPH_SAFE_INSET)
    )
    const nextGlyphY = clamp(
      localY - glyphHeight / 2,
      GLYPH_SAFE_INSET,
      Math.max(GLYPH_SAFE_INSET, bounds.height - glyphHeight - GLYPH_SAFE_INSET)
    )

    setMotionValue(glyphX, nextGlyphX, snap)
    setMotionValue(glyphY, nextGlyphY, snap)
  }

  const handlePointerEnter = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (!supportsFineHover || event.pointerType !== "mouse") return

    updateHoverTargets(event, { snap: true })
    setIsHovered(true)
    onHoverChange(collection.slug)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (!supportsFineHover || event.pointerType !== "mouse") return

    updateHoverTargets(event)

    if (!isHovered) {
      setIsHovered(true)
      onHoverChange(collection.slug)
    }
  }

  const handlePointerLeave = () => {
    if (!supportsFineHover) return

    setIsHovered(false)
    onHoverChange(null)
  }

  const href = `${GALLERY_BASE_PATH}/${collection.slug}`

  const handleClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (window.location.pathname + window.location.hash !== FRAMESCAPE_HREF) {
      window.history.replaceState(null, "", FRAMESCAPE_HREF)
    }
    onNavigate(href)
  }

  return (
    <Link
      href={href}
      className="collection-card"
      onClick={handleClick}
      onContextMenu={preventMediaContextMenu}
      onDragStart={preventMediaDragStart}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        display: "block",
        position: "relative",
        background: "transparent",
        border: "none",
        borderRadius: 0,
        overflow: "hidden",
        textDecoration: "none",
        userSelect: "none",
        cursor: supportsFineHover && isHovered ? "none" : "pointer",
        boxShadow: isActive ? "0 16px 38px rgba(0, 0, 0, 0.35)" : "none",
      }}
    >
      <div
        className="protected-media"
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: collection.coverPhoto ? "auto" : "4 / 3",
          background: "transparent",
          overflow: "hidden",
        }}
      >
        {collection.coverPhoto && (
          <Image
            src={collection.coverPhoto}
            alt={collection.name}
            width={600}
            height={600}
            sizes="(max-width: 768px) 50vw, 300px"
            className="protected-media framescape-img"
            draggable={false}
            style={{ width: "100%", height: "auto", display: "block" }}
            onContextMenu={preventMediaContextMenu}
            onDragStart={preventMediaDragStart}
          />
        )}

        {/* Placeholder — shown when no image is found */}
        <div
          aria-hidden
          style={{
            display: collection.coverPhoto ? "none" : "flex",
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1a1612 0%, #0e0c0a 100%)",
          }}
        >
          <span style={{ color: "rgba(192,117,72,0.25)", fontSize: "2rem" }}>✦</span>
        </div>

        {supportsFineHover && (
          <>
            <motion.div
              aria-hidden
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.92,
              }}
              transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                x: glyphX,
                y: glyphY,
                pointerEvents: "none",
                zIndex: 5,
                transformOrigin: "center center",
              }}
            >
              <span
                ref={glyphRef}
                style={{
                  display: "inline-block",
                  color: "#CD845A",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: "1.27rem",
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                {HOVER_GLYPH}
              </span>
            </motion.div>
          </>
        )}
      </div>
    </Link>
  )
}

export default function Framescape() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const isNavigatingRef = useRef(false)
  const hasLocked = useRef(false)
  const [scope, animate] = useAnimate()
  const supportsFineHover = useFinePointer()
  const router = useRouter()

  const handleNavigate = useCallback((href: string) => {
    if (isNavigatingRef.current) return
    isNavigatingRef.current = true
    setIsNavigating(true)
    
    // Let the images drift up slightly as they get swallowed by the shadows
    animate("img", { y: -15 }, { duration: 0.6, ease: [0.33, 1, 0.68, 1] })
    setTimeout(() => router.push(href), 600)
  }, [animate, router])

  // ── Safeguard against bfcache (back button) keeping the screen black ──
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setIsNavigating(false)
        isNavigatingRef.current = false
      }
    }
    window.addEventListener("pageshow", handlePageShow)
    return () => window.removeEventListener("pageshow", handlePageShow)
  }, [])

  // ── 30 % visibility → trigger card animation (re-fires on every entry) ──
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        const visible = entry.intersectionRatio >= 0.3
        if (visible) setHasBeenVisible(true)
        setIsVisible(visible)
      },
      { threshold: [0, 0.3] }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // ── 100 % visibility → stick the window for 4 s (first time only) ───────
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const lockObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry || hasLocked.current) return

        const entering = entry.boundingClientRect.top >= 0
        if (entry.intersectionRatio >= 0.95 && entering) {
          hasLocked.current = true
          lockObserver.disconnect()

          const rect = section.getBoundingClientRect()
          window.scrollTo(0, window.scrollY + rect.top)

          document.documentElement.style.overflow = "hidden"

          setTimeout(() => {
            document.documentElement.style.overflow = ""
          }, 4000)
        }
      },
      { threshold: 0.95 }
    )

    lockObserver.observe(section)
    return () => {
      lockObserver.disconnect()
      document.documentElement.style.overflow = ""
    }
  }, [])

  // ── useAnimate + stagger drives all images ──
  useEffect(() => {
    if (isVisible) {
      animate(
        "img",
        { opacity: [0, 1], y: [24, 0] },
        { duration: 1.1, delay: stagger(0.15), ease: [0.76, 0, 0.36, 1] }
      )
    } else {
      animate("img", { opacity: 0, y: 24 }, { duration: hasBeenVisible ? 0.5 : 0 })
    }
  }, [isVisible, animate, hasBeenVisible])

  return (
    <section
      id={SECTION_IDS.photography}
      ref={sectionRef}
      style={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Scope wrapper for useAnimate */}
      <div ref={scope} style={{ position: "absolute", inset: 0 }}>
        <Floating sensitivity={-1} easingFactor={0.1} className="z-[4]">
          {COLLECTIONS.slice(0, SLOTS.length).map((collection, i) => {
            const slot = SLOTS[i % SLOTS.length]
            const isActive = supportsFineHover && activeSlug === collection.slug

            return (
              <FloatingElement
                key={collection.slug}
                depth={slot.depth}
                style={{
                  top: slot.top,
                  left: slot.left,
                  width: slot.width,
                  zIndex: isActive ? 8 : 4,
                }}
              >
                <div style={{ transform: `rotate(${slot.rotate})` }}>
                  <CollectionCard
                    collection={collection}
                    supportsFineHover={supportsFineHover}
                    isActive={isActive}
                    onHoverChange={setActiveSlug}
                    onNavigate={handleNavigate}
                  />
                </div>
              </FloatingElement>
            )
          })}
        </Floating>
      </div>

      {/* Section title — centered, rendered above floating cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isNavigating ? { opacity: 0 } : isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{
          duration: isNavigating ? 0.22 : isVisible ? 0.65 : hasBeenVisible ? 0.45 : 0,
          delay: isVisible && !isNavigating ? 2.1 : 0,
          ease: isNavigating ? [0.76, 0, 0.36, 1] : isVisible ? "easeOut" : "easeIn",
        }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          pointerEvents: "none",
          textAlign: "center",
          padding: "0 1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(1.1rem, 3.4vw, 3.2rem)",
            fontFamily: "var(--font-press-start), monospace",
            fontStyle: "normal",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: "#f2ede8",
            margin: 0,
          }}
        >
          blink. missed it.
        </h2>
      </motion.div>

      {/* Cinematic fade to black veil */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isNavigating ? 1 : 0 }}
        transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
        style={{
          position: "fixed",
          inset: 0,
          background: "#100e0c",
          zIndex: 100,
          pointerEvents: isNavigating ? "all" : "none",
        }}
      />
    </section>
  )
}
