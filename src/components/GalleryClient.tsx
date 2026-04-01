"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "motion/react"
import { ShaderAnimation } from "@/components/ui/shader-lines"

import type { Collection } from "@/lib/collections"
import { GALLERY_BASE_PATH } from "@/lib/collections"
import DragElements from "@/components/fancy/blocks/drag-elements"
import GridBackground from "@/components/GridBackground"
import { FRAMESCAPE_HREF } from "@/lib/home-entry"
import {
  preventMediaContextMenu,
  preventMediaDragStart,
} from "@/lib/media-protection"

interface GalleryClientProps {
  collection: Collection
}

// ── Stable seeded pseudo-random (identical to the hash used in the old implementation)
const hashString = (value: string): number => {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const seededValue = (slug: string, index: number, channel: string): number =>
  hashString(`${slug}:${index}:${channel}`) / 4294967295

// Extract number from filename for sorting
const extractNum = (str: string) => {
  const match = str.match(/(\d+)\D*$/)
  return match ? parseInt(match[1], 10) : 0
}

// ── Build pile: all cards start at nearly the same position,
//   variance in rotation (-17° → +17°) creates the "stacked" depth illusion.
//   Tiny xy jitter (±11px) gives organic imperfection, not a perfect stack.
const buildPilePositions = (slug: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    // Center the pile around ~28% from left, vertically middle of viewport
    top: `calc(50vh - 135px + ${Math.round((seededValue(slug, i, "y") - 0.5) * 22)}px)`,
    left: `calc(24vw - 133px + ${Math.round((seededValue(slug, i, "x") - 0.5) * 18)}px)`,
    // Wide rotation spread = you can see each card peeking out
    rotate: (seededValue(slug, i, "r") - 0.5) * 34,
  }))

// Bug fix: width=828 is the first Next.js deviceSize entry (≥640), so the srcset
// now includes 640w/750w/828w entries — enough for 2× retina at 315px display.
// imgH preserves the collection's true aspect ratio to prevent CLS before load.
const IMG_W = 828

export default function GalleryClient({ collection }: GalleryClientProps) {
  const imgH = Math.round(IMG_W * collection.photoAspectH / 2000)

  const photos = useMemo(() => {
    // Remove the coverPhoto from the original list if it exists to avoid duplicates
    const otherPhotos = collection.photos.filter((p) => p !== collection.coverPhoto)
    // Sort descending so lower values are at the end (visually on top of the stack)
    otherPhotos.sort((a, b) => extractNum(b) - extractNum(a))
    // Append coverPhoto at the end so it renders visually on top of all other photos
    return collection.coverPhoto ? [...otherPhotos, collection.coverPhoto] : otherPhotos
  }, [collection.photos, collection.coverPhoto])

  const positions = useMemo(
    () => buildPilePositions(collection.slug, Math.max(photos.length, 1)),
    [collection.slug, photos.length]
  )

  // Animate entrance only when a saved (scattered) layout exists — pile state appears instantly
  const [hasStoredLayout, setHasStoredLayout] = useState<boolean>(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`gallery-drag-${collection.slug}`)
      if (!raw) return
      const parsed = JSON.parse(raw) as { offsets?: unknown[] }
      if (Array.isArray(parsed.offsets) && parsed.offsets.length > 0) {
        setHasStoredLayout(true)
      }
    } catch {
      // ignore
    }
  }, [collection.slug])

  // ── Shader overlay: shows every visit, lifts after 2 s ──────────────────────
  // Image-load counting was removed: onLoad fires once per element lifetime but
  // React Strict Mode double-runs the effect and resets the counter, so cached
  // images never re-fire and the overlay gets permanently stuck. The 2 s timer
  // alone is sufficient — images render into the DOM under the overlay and are
  // fully loaded long before the shader dissolves.
  const [shaderVisible, setShaderVisible] = useState(false)
  const [overlayDone, setOverlayDone] = useState(false)
  const [overlayMounted, setOverlayMounted] = useState(true)

  useEffect(() => {
    setShaderVisible(false)
    setOverlayDone(false)
    setOverlayMounted(true)
    
    // The screen arrived black from Framescape. Allow a moment, then fade in the shader lines.
    const timer1 = setTimeout(() => setShaderVisible(true), 150)
    
    // After they've glowed for a bit, fade the entire black overlay + shader out to reveal the gallery.
    const timer2 = setTimeout(() => setOverlayDone(true), 1100)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [collection.slug])

  const headingWords = (collection.galleryHeading || "all your memories.").trim().split(" ")
  const lastHeadingWord = headingWords.pop()
  const restOfHeading = headingWords.length > 0 ? headingWords.join(" ") + " " : ""

  return (
    <section
      className="relative min-h-dvh overflow-hidden"
      style={{ background: "#100e0c" }}
    >
      <GridBackground alwaysActive />

      {/* ── Back breadcrumb ─────────────────────────────────────── */}
      <motion.div
        style={{ position: "absolute", top: "1.5rem", left: "1.75rem", zIndex: 50 }}
        animate={overlayDone ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: overlayDone ? 0.4 : 0, ease: "easeOut" }}
      >
        <Link
          href={FRAMESCAPE_HREF}
          style={{
            fontSize: "0.68rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#8c7f74",
            textDecoration: "none",
          }}
          className="gallery-nav-link"
        >
          ← FRAMESCAPE
        </Link>
      </motion.div>

      {/* ── Ambient warm glow behind the pile (pure CSS, no JS) ─── */}
      <motion.div
        className="pointer-events-none absolute"
        style={{
          top: "18%",
          left: "5%",
          width: "480px",
          height: "480px",
          background:
            "radial-gradient(circle, rgba(192,117,72,0.22) 0%, transparent 62%)",
          filter: "blur(80px)",
          zIndex: 1,
        }}
        animate={overlayDone ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.0, delay: overlayDone ? 0.2 : 0, ease: "easeOut" }}
      />

      {/* ── Drag canvas — fills full viewport, z:10 ─────────────── */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 10 }}
        animate={overlayDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      >
        {photos.length > 0 ? (
          <DragElements
            initialPositions={positions}
            selectedOnTop
            storageKey={`gallery-drag-${collection.slug}`}
            className="h-full w-full"
          >
            {photos.map((src, i) => (
              <motion.div
                key={`${collection.slug}-${i}`}
                className="flex items-start justify-center rounded-[2px] shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
                style={{
                  width: i === photos.length - 1
                    ? "clamp(250px, 30vw, 315px)"
                    : "clamp(245px, 28vw, 285px)",
                  padding: "0",
                }}
              >
                <div
                  className="protected-media relative overflow-hidden bg-[#f4f1ec]"
                  style={{ width: "100%" }}
                  onContextMenu={preventMediaContextMenu}
                  onDragStart={preventMediaDragStart}
                >
                  <Image
                    src={src}
                    alt={`${collection.name} photo ${i + 1}`}
                    width={IMG_W}
                    height={imgH}
                    sizes="(max-width: 767px) 285px, 315px"
                    className="protected-media pointer-events-none select-none block"
                    style={{ width: "100%", height: "auto" }}
                    loading="lazy"
                    draggable={false}
                    onContextMenu={preventMediaContextMenu}
                    onDragStart={preventMediaDragStart}
                  />
                </div>
              </motion.div>
            ))}
          </DragElements>
        ) : (
          /* ── Empty collection placeholder ── */
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center" style={{ color: "#b5aa9e" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
                ✦
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Coming Soon
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Right-side headline text (pointer-events-none, z:20) ── */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex flex-col items-end justify-center"
        style={{
          zIndex: 20,
          paddingRight: "clamp(2rem, 8vw, 6rem)",
        }}
        animate={overlayDone ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
        transition={{ duration: 0.7, delay: overlayDone ? 0.3 : 0, ease: [0.76, 0, 0.36, 1] }}
      >
        <div className="text-right">
          <h1
            className="leading-[0.9] uppercase"
            style={{
              fontSize: "clamp(2.6rem, 6vw, 5.2rem)",
              letterSpacing: "-0.06em",
              color: "#9a8f80",
              fontWeight: 400,
              margin: 0,
            }}
          >
            {restOfHeading}
            <span style={{ fontWeight: 700, color: "#f2ede8" }}>{lastHeadingWord}</span>
          </h1>

          <p
            style={{
              marginTop: "0.9rem",
              fontSize: "0.72rem",
              color: "#b5aa9e",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {collection.name} - Naman Ladha
          </p>
        </div>
      </motion.div>

      {/* ── Bottom bar: count (pointer-events-auto, z:30) ── */}
      <motion.div
        className="pointer-events-auto absolute bottom-0 left-0 right-0 flex items-center justify-center"
        style={{
          zIndex: 30,
          padding: "1.25rem 1.75rem",
          borderTop: "1px solid rgba(192,117,72,0.10)",
        }}
        animate={overlayDone ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: overlayDone ? 0.5 : 0, ease: "easeOut" }}
      >
        <span
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#b5aa9e",
          }}
        >
          {String(photos.length).padStart(2, "0")} photographs
        </span>
      </motion.div>

      {/* ── Shader overlay — full screen, lifts after 2 s + images loaded ── */}
      {overlayMounted && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: overlayDone ? 0 : 1 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 90,
            background: "#100e0c",
            pointerEvents: overlayDone ? "none" : "all",
          }}
          onAnimationComplete={() => {
            if (overlayDone) setOverlayMounted(false)
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: shaderVisible ? 1 : 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ width: "100%", height: "100%" }}
          >
            <ShaderAnimation />
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}
