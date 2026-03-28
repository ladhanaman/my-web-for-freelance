"use client"

import Image from "next/image"
import Link from "next/link"

import type { Collection } from "@/lib/collections"
import { GALLERY_BASE_PATH } from "@/lib/collections"
import DragElements from "@/components/fancy/blocks/drag-elements"

interface GalleryClientProps {
  collection: Collection
  prev?: Collection | null
  next?: Collection | null
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

// ── Build pile: all cards start at nearly the same position,
//   variance in rotation (-17° → +17°) creates the "stacked" depth illusion.
//   Tiny xy jitter (±11px) gives organic imperfection, not a perfect stack.
const buildPilePositions = (slug: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    // Center the pile around ~28% from left, vertically middle of viewport
    top:  `calc(50vh - 110px + ${Math.round((seededValue(slug, i, "y") - 0.5) * 22)}px)`,
    left: `calc(24vw - 88px + ${Math.round((seededValue(slug, i, "x") - 0.5) * 18)}px)`,
    // Wide rotation spread = you can see each card peeking out
    rotate: (seededValue(slug, i, "r") - 0.5) * 34,
  }))

export default function GalleryClient({ collection, prev, next }: GalleryClientProps) {
  // Fall back to coverPhoto if photos array is empty
  const photos =
    collection.photos.length > 0
      ? collection.photos
      : collection.coverPhoto
        ? [collection.coverPhoto]
        : []

  const positions = buildPilePositions(collection.slug, Math.max(photos.length, 1))

  return (
    <section
      className="relative min-h-dvh overflow-hidden"
      style={{
        // ← Same background as before
        background: "#fdf8f3",
        backgroundImage: [
          "linear-gradient(rgba(192,117,72,0.08) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(192,117,72,0.08) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "64px 64px",
      }}
    >
      {/* ── Back breadcrumb ─────────────────────────────────────── */}
      <Link
        href="/#framescape"
        style={{
          position: "absolute",
          top: "1.5rem",
          left: "1.75rem",
          zIndex: 50,
          fontSize: "0.68rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#8c7f74",
          textDecoration: "none",
        }}
        className="gallery-nav-link"
      >
        ← Collections
      </Link>

      {/* ── Ambient warm glow behind the pile (pure CSS, no JS) ─── */}
      <div
        className="pointer-events-none absolute"
        style={{
          // Glow is positioned to sit just behind/beneath the pile cluster
          top: "18%",
          left: "5%",
          width: "480px",
          height: "480px",
          background:
            "radial-gradient(circle, rgba(192,117,72,0.22) 0%, transparent 62%)",
          filter: "blur(80px)",
          zIndex: 1,
        }}
      />

      {/* ── Drag canvas — fills full viewport, z:10 ─────────────── */}
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {photos.length > 0 ? (
          <DragElements
            initialPositions={positions}
            selectedOnTop
            className="h-full w-full"
          >
            {photos.map((src, i) => (
              // Polaroid card — identical styling to the original
              <div
                key={`${collection.slug}-${i}`}
                className="flex items-start justify-center rounded-[2px] bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
                style={{
                  width: "clamp(140px, 17vw, 178px)",
                  // total height = image area + bottom label gap
                  paddingTop: "13px",
                  paddingLeft: "13px",
                  paddingRight: "13px",
                  paddingBottom: "28px",
                }}
              >
                <div
                  className="relative overflow-hidden bg-[#f4f1ec]"
                  style={{
                    width: "100%",
                    // image area = clamp(130px, …)
                    height: "clamp(130px, 20vw, 170px)",
                  }}
                >
                  <Image
                    src={src}
                    fill
                    alt={`${collection.name} photo ${i + 1}`}
                    sizes="(max-width: 767px) 140px, 178px"
                    className="pointer-events-none object-cover select-none"
                    draggable={false}
                    // Topmost card (last in array) gets priority
                    priority={i === photos.length - 1}
                  />
                </div>
              </div>
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
      </div>

      {/* ── Right-side headline text (pointer-events-none, z:20) ── */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-end justify-center"
        style={{
          zIndex: 20,
          paddingRight: "clamp(2rem, 8vw, 6rem)",
        }}
      >
        <div className="text-right">
          {/* Matches the exact original h1 style */}
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
            all your{" "}
            <span style={{ fontWeight: 700, color: "#2c2925" }}>memories.</span>
          </h1>

          {/* Collection subtitle — was unused before, now surfaced */}
          <p
            style={{
              marginTop: "0.9rem",
              fontSize: "0.72rem",
              color: "#b5aa9e",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {collection.name} — {collection.description}
          </p>
        </div>
      </div>

      {/* ── Bottom bar: prev / count / next (pointer-events-auto, z:30) ── */}
      <div
        className="pointer-events-auto absolute bottom-0 left-0 right-0 flex items-center justify-between"
        style={{
          zIndex: 30,
          padding: "1.25rem 1.75rem",
          borderTop: "1px solid rgba(192,117,72,0.10)",
        }}
      >
        <div style={{ minWidth: "6rem" }}>
          {prev && (
            <Link
              href={`${GALLERY_BASE_PATH}/${prev.slug}`}
              className="gallery-nav-link"
            >
              ← {prev.name}
            </Link>
          )}
        </div>

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

        <div style={{ minWidth: "6rem", textAlign: "right" }}>
          {next && (
            <Link
              href={`${GALLERY_BASE_PATH}/${next.slug}`}
              className="gallery-nav-link"
            >
              {next.name} →
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
