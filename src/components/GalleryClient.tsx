"use client"

import { useRef } from "react"
import Link from "next/link"
import DragElements from "@/components/fancy/blocks/drag-elements"
import type { Collection } from "@/lib/collections"

// ── Photo card dimensions
const PHOTO_W = 200
const PHOTO_H = 266

// ── Scatter positions for the drag board
// Expressed as percentage strings so they scale with viewport.
// left capped at ~54% so the rightmost card fits on 375 px mobile
// top capped at ~62% so the bottom card fits within the board height
const SCATTER: { top: string; left: string; rotate: number }[] = [
  { top: "3%",  left: "2%",   rotate: -4 },
  { top: "4%",  left: "28%",  rotate:  3 },
  { top: "5%",  left: "52%",  rotate: -5 },
  { top: "14%", left: "8%",   rotate: -5 },
  { top: "16%", left: "34%",  rotate:  2 },
  { top: "10%", left: "46%",  rotate: -2 },
  { top: "27%", left: "12%",  rotate:  5 },
  { top: "25%", left: "40%",  rotate: -3 },
  { top: "27%", left: "54%",  rotate:  4 },
  { top: "36%", left: "22%",  rotate: -7 },
  { top: "38%", left: "50%",  rotate:  5 },
  { top: "44%", left: "4%",   rotate: -6 },
  { top: "42%", left: "14%",  rotate: -4 },
  { top: "48%", left: "32%",  rotate:  3 },
  { top: "52%", left: "54%",  rotate: -4 },
  { top: "58%", left: "6%",   rotate:  3 },
  { top: "60%", left: "44%",  rotate: -4 },
  { top: "62%", left: "20%",  rotate:  6 },
  { top: "20%", left: "54%",  rotate: -6 },
  { top: "55%", left: "24%",  rotate: -5 },
]

function PhotoCard({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      style={{
        width:      PHOTO_W,
        height:     PHOTO_H,
        background: "#1a1612",
        border:     "1px solid rgba(192,117,72,0.10)",
        borderRadius: 3,
        overflow:   "hidden",
        boxShadow:  "0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)",
        userSelect: "none",
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
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
      ) : null}
      {/* Placeholder when image path is empty or fails to load */}
      <div
        aria-hidden
        style={{
          display:        src ? "none" : "flex",
          width:          "100%",
          height:         "100%",
          alignItems:     "center",
          justifyContent: "center",
          background:     "linear-gradient(135deg, #1a1612 0%, #0e0c0a 100%)",
        }}
      >
        <span style={{ color: "rgba(192,117,72,0.25)", fontSize: "2.5rem" }}>✦</span>
      </div>
    </div>
  )
}

export default function GalleryClient({ collection }: { collection: Collection }) {
  const boardRef = useRef<HTMLDivElement>(null)

  return (
    <div
      style={{
        minHeight:      "100vh",
        background:     "#100e0c",
        display:        "flex",
        flexDirection:  "column",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        style={{
          padding:        "1.4rem 2rem",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          borderBottom:   "1px solid rgba(255,255,255,0.05)",
          position:       "sticky",
          top:            0,
          zIndex:         100,
          background:     "rgba(16,14,12,0.92)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Link
          href="/#framescape"
          style={{
            display:       "flex",
            alignItems:    "center",
            gap:           "0.4rem",
            color:         "#5a5048",
            textDecoration:"none",
            fontSize:      "0.72rem",
            fontWeight:    600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            transition:    "color 0.2s ease",
            minWidth:      80,
          }}
        >
          ← Back
        </Link>

        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize:      "clamp(1rem, 2.5vw, 1.45rem)",
              fontWeight:    700,
              color:         "#f2ede8",
              letterSpacing: "-0.03em",
              margin:        0,
              lineHeight:    1.1,
            }}
          >
            {collection.name}
          </h1>
          <p
            style={{
              fontSize:      "0.65rem",
              color:         "#3a3530",
              margin:        "0.25rem 0 0",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {collection.photos.length} photographs
          </p>
        </div>

        <p
          style={{
            fontSize:      "0.65rem",
            color:         "#3a3530",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            textAlign:     "right",
            minWidth:      80,
          }}
        >
          Drag to explore
        </p>
      </header>

      {/* ── Drag board ─────────────────────────────────────────── */}
      <div
        ref={boardRef}
        style={{
          position: "relative",
          flex:     1,
          width:    "100%",
          overflow: "hidden",
          minHeight: 500,
        }}
      >
        {collection.photos.map((photo, i) => {
          const pos = SCATTER[i % SCATTER.length]
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top:      pos.top,
                left:     pos.left,
                width:    PHOTO_W,
                height:   PHOTO_H,
                zIndex:   i,
              }}
            >
              {/*
               * Each photo gets its own DragElements instance so it can be
               * independently dragged. dragConstraints={boardRef} pins all
               * photos to the shared board bounds.
               */}
              <DragElements dragConstraints={boardRef}>
                <div style={{ transform: `rotate(${pos.rotate}deg)` }}>
                  <PhotoCard
                    src={photo}
                    alt={`${collection.name} — photo ${i + 1}`}
                  />
                </div>
              </DragElements>
            </div>
          )
        })}

        {/* Empty state when no photos have been added yet */}
        {collection.photos.length === 0 && (
          <div
            style={{
              position:       "absolute",
              inset:          0,
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              gap:            "0.75rem",
              color:          "#3a3530",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>✦</span>
            <p
              style={{
                fontSize:      "0.78rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Photos coming soon
            </p>
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer
        style={{
          padding:      "1rem 2rem",
          textAlign:    "center",
          borderTop:    "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <p
          style={{
            fontSize:      "0.65rem",
            color:         "#2e2a25",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontStyle:     "italic",
          }}
        >
          {collection.description}
        </p>
      </footer>
    </div>
  )
}
