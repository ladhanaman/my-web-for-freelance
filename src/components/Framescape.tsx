"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
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
  // Top-left step
  { top: "13%", left: "2%", rotate: "-2deg", depth: 1.05, width: "clamp(100px, 15vw, 260px)" },
  { top: "30%", left: "19%", rotate: "2deg", depth: 1.15, width: "clamp(100px, 15vw, 260px)" },
  // Top-center
  { top: "11%", left: "42%", rotate: "-1deg", depth: 0.95, width: "clamp(100px, 15vw, 260px)" },
  // Top-right step
  { top: "13%", left: "64%", rotate: "1deg", depth: 1.2, width: "clamp(100px, 15vw, 260px)" },
  { top: "30%", left: "80%", rotate: "-2deg", depth: 0.9, width: "clamp(100px, 15vw, 260px)" },
  // Mid-left
  { top: "50%", left: "2%", rotate: "0deg", depth: 1.1, width: "clamp(100px, 15vw, 260px)" },
  // Mid-right
  { top: "50%", left: "73%", rotate: "-1deg", depth: 1.05, width: "clamp(100px, 15vw, 260px)" },
  // Bottom-left
  { top: "71%", left: "10%", rotate: "1deg", depth: 1.0, width: "clamp(100px, 15vw, 260px)" },
  // Bottom-right
  { top: "71%", left: "64%", rotate: "-1deg", depth: 1.1, width: "clamp(100px, 15vw, 260px)" },
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
          background: "#000",
          overflow: "hidden",
        }}
      >
        {collection.coverPhoto && (
          <img
            src={collection.coverPhoto}
            alt={collection.name}
            draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
  // Ensures the scroll-lock only ever fires once per page load
  const hasLocked = useRef(false)

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

        // intersectionRatio >= 0.95 fires on BOTH entry (section arriving from
        // below) AND exit (section leaving from top). Distinguish via
        // boundingClientRect.top:
        //   top >= 0 → section top is at/below the viewport top → entering ✓
        //   top <  0 → section top is above the viewport → scrolled past   ✗
        const entering = entry.boundingClientRect.top >= 0
        if (entry.intersectionRatio >= 0.95 && entering) {
          hasLocked.current = true
          lockObserver.disconnect()

          // Snap instantly to exact alignment so the section fills the viewport.
          // We use an instant (non-smooth) scroll because a smooth scroll scrolls
          // DOWN ~40 px, which pulls the contact section up to the viewport
          // bottom and lets it bleed in. An instant snap + immediate overflow:hidden
          // fires before the next paint, so nothing outside Framescape appears.
          const rect = section.getBoundingClientRect()
          window.scrollTo(0, window.scrollY + rect.top)

          // Hard lock — clamps the entire page at this exact scroll position
          document.documentElement.style.overflow = "hidden"

          // Release after 4 s
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
      {/* Floating collection card layer */}
      <Floating sensitivity={1.1} easingFactor={0.1} className="z-[4]">
        {COLLECTIONS.slice(0, SLOTS.length).map((collection, i) => {
          const slot = SLOTS[i % SLOTS.length]
          return (
            <FloatingElement
              key={collection.slug}
              depth={slot.depth}
              style={{ top: slot.top, left: slot.left, width: slot.width }}
            >
              {/*
               * Rotation lives on a plain div — keeps it fully out of Framer
               * Motion's transform computation so there's no override conflict.
               * motion.div only animates opacity + a subtle y lift.
               */}
              <div style={{ transform: `rotate(${slot.rotate})` }}>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                  transition={{
                    duration: isVisible ? 1.1 : hasBeenVisible.current ? 0.5 : 0,
                    delay: isVisible ? 0.3 + i * 0.12 : 0,
                    ease: [0.76, 0, 0.36, 1],
                  }}
                >
                  <CollectionCard collection={collection} />
                </motion.div>
              </div>
            </FloatingElement>
          )
        })}
      </Floating>

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
        {/* Main title */}
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
