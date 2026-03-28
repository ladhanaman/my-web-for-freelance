"use client"

import { useEffect, useRef, useState } from "react"
import { motion, stagger, useAnimate } from "motion/react"
import Link from "next/link"
import Floating, { FloatingElement } from "@/components/fancy/image/parallax-floating"
import {
  COLLECTIONS,
  GALLERY_BASE_PATH,
  SECTION_IDS,
  type Collection,
} from "@/lib/collections"

// ── Layout slots for collection cards — 9 total
// top/left are percentage strings relative to the section
// depth controls parallax intensity (higher = moves more)
// All cards are 4:3 — height ≈ 75% of width
const SLOTS = [
  // Top-left
  { top: "10%", left: "12%", rotate: "-2deg", depth: 1.05, width: "clamp(100px, 15vw, 260px)" },
  { top: "28%", left: "28%", rotate: "2deg",  depth: 1.15, width: "clamp(100px, 15vw, 260px)" },
  // Top-center
  { top: "8%",  left: "46%", rotate: "-1deg", depth: 0.95, width: "clamp(100px, 15vw, 260px)" },
  // Top-right
  { top: "10%", left: "66%", rotate: "1deg",  depth: 1.2,  width: "clamp(100px, 15vw, 260px)" },
  { top: "28%", left: "80%", rotate: "-2deg", depth: 0.9,  width: "clamp(100px, 15vw, 260px)" },
  // Mid-left
  { top: "50%", left: "14%", rotate: "0deg",  depth: 1.1,  width: "clamp(100px, 15vw, 260px)" },
  // Mid-right
  { top: "50%", left: "76%", rotate: "-1deg", depth: 1.05, width: "clamp(100px, 15vw, 260px)" },
  // Bottom-left
  { top: "70%", left: "26%", rotate: "1deg",  depth: 1.0,  width: "clamp(100px, 15vw, 260px)" },
  // Bottom-right
  { top: "70%", left: "64%", rotate: "-1deg", depth: 1.1,  width: "clamp(100px, 15vw, 260px)" },
] as const

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link
      href={`${GALLERY_BASE_PATH}/${collection.slug}`}
      className="collection-card"
      style={{
        display: "block",
        background: "transparent",
        border: "none",
        borderRadius: 0,
        overflow: "hidden",
        textDecoration: "none",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 3",
          background: "transparent",
          overflow: "hidden",
        }}
      >
        {collection.coverPhoto && (
          <img
            src={collection.coverPhoto}
            alt={collection.name}
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0 }}
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget
              img.style.display = "none"
              const fallback = img.nextElementSibling as HTMLElement | null
              if (fallback) fallback.style.display = "flex"
            }}
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
      </div>
    </Link>
  )
}

export default function Framescape() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const hasBeenVisible = useRef(false)
  const hasLocked = useRef(false)
  const [scope, animate] = useAnimate()

  // ── 30 % visibility → trigger card animation (re-fires on every entry) ──
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        const visible = entry.intersectionRatio >= 0.3
        if (visible) hasBeenVisible.current = true
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
      animate("img", { opacity: 0, y: 24 }, { duration: hasBeenVisible.current ? 0.5 : 0 })
    }
  }, [isVisible, animate])

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
            return (
              <FloatingElement
                key={collection.slug}
                depth={slot.depth}
                style={{ top: slot.top, left: slot.left, width: slot.width }}
              >
                <div style={{ transform: `rotate(${slot.rotate})` }}>
                  <CollectionCard collection={collection} />
                </div>
              </FloatingElement>
            )
          })}
        </Floating>
      </div>

      {/* Section title — centered, rendered above floating cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{
          duration: isVisible ? 0.75 : hasBeenVisible.current ? 0.45 : 0,
          delay: isVisible ? 2.5 : 0,
          ease: isVisible ? "easeOut" : "easeIn",
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
    </section>
  )
}
