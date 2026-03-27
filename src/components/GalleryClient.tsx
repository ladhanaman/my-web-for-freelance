"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import GridBackground from "@/components/GridBackground"
import DragElements from "@/components/fancy/blocks/drag-elements"
import type { Collection } from "@/lib/collections"

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

interface PhotoLayout {
  rotation: number
  /** outer card width in px */
  cardW: number
}

interface PileOffset {
  x: number
  y: number
}

// ── Fixed header height used for vertical centering calculations
const HEADER_H = 65

export default function GalleryClient({ collection }: { collection: Collection }) {
  const [ready, setReady]   = useState(false)
  const [layout, setLayout] = useState<PhotoLayout[]>([])
  const [pile, setPile]     = useState<PileOffset>({ x: 0, y: 0 })

  useEffect(() => {
    setReady(true)
    const W      = window.innerWidth
    const H      = window.innerHeight
    const mobile = W < 768

    const layouts: PhotoLayout[] = collection.photos.map(() => ({
      rotation: randomInt(-12, 12),
      cardW: mobile ? randomInt(126, 154) : randomInt(182, 224),
    }))
    setLayout(layouts)

    // Estimate card height for centering (assume ~3:2 photo + 24px equal padding)
    const avgCardW    = layouts.reduce((s, l) => s + l.cardW, 0) / (layouts.length || 1)
    const estPhotoH   = Math.round((avgCardW - 24) * (2 / 3))
    const estCardH    = estPhotoH + 24

    // Pile centred on the same axis as the right-hand text panel
    // Both vertically centred in the usable area below the header
    setPile({
      x: Math.round(W * 0.17 - avgCardW / 2),
      y: Math.round(HEADER_H + (H - HEADER_H - estCardH) / 2),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.photos.length])

  return (
    <div
      style={{
        width:      "100dvw",
        height:     "100dvh",
        background: "#100e0c",
        position:   "relative",
        overflow:   "hidden",
      }}
    >
      <GridBackground alwaysActive />

      {/* ── Fixed header ──────────────────────────────────────────── */}
      <header
        style={{
          position:       "fixed",
          top:            0,
          left:           0,
          right:          0,
          zIndex:         200,
          padding:        "1.2rem 2rem",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          background:     "rgba(16,14,12,0.88)",
          backdropFilter: "blur(10px)",
          borderBottom:   "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Link
          href="/#framescape"
          style={{
            color:          "#5a5048",
            textDecoration: "none",
            fontSize:       "0.72rem",
            fontWeight:     600,
            letterSpacing:  "0.14em",
            textTransform:  "uppercase",
            transition:     "color 0.2s ease",
            minWidth:       80,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#C07548" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#5a5048" }}
        >
          ← Back
        </Link>

        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize:      "clamp(1rem, 2.5vw, 1.4rem)",
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
              fontSize:      "0.62rem",
              color:         "#3a3530",
              margin:        "0.2rem 0 0",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {collection.photos.length} photographs
          </p>
        </div>

        <p
          style={{
            fontSize:      "0.62rem",
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

      {/* ── Right-half title — vertically centred in usable area ──── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.88, delay: ready ? 0.35 : 0 }}
        style={{
          position:       "absolute",
          top:            HEADER_H,
          right:          0,
          bottom:         0,
          width:          "55%",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          zIndex:         2,
          pointerEvents:  "none",
          textAlign:      "center",
          padding:        "0 2.5rem",
        }}
      >
        <p
          style={{
            fontSize:      "clamp(0.8rem, 1.8vw, 1rem)",
            color:         "#5a5048",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin:        0,
          }}
        >
          all your
        </p>
        <h2
          style={{
            fontSize:      "clamp(2.3rem, 4.9vw, 4.6rem)",
            fontFamily:    "Georgia, 'Times New Roman', serif",
            fontStyle:     "italic",
            fontWeight:    600,
            letterSpacing: "-0.02em",
            lineHeight:    1,
            color:         "#f2ede8",
            margin:        "0.15em 0 0",
          }}
        >
          {collection.name.toLowerCase()}.
        </h2>
        <p
          style={{
            fontSize:      "0.62rem",
            color:         "#3a3530",
            marginTop:     "0.6rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {collection.description}
        </p>
      </motion.div>

      {/* ── Drag board ──────────────────────────────────────────────── */}
      {layout.length > 0 && (
        <DragElements
          dragMomentum={false}
          className="p-40"
          initialPositions={collection.photos.map(() => ({ x: pile.x, y: pile.y }))}
        >
          {collection.photos.map((photo, index) => {
            const cfg = layout[index]
            if (!cfg) return null
            // Inner photo fills card minus equal 12px padding on all sides
            const photoW = cfg.cardW - 24
            return (
              <div
                key={index}
                className="bg-white shadow-2xl"
                style={{
                  transform: `rotate(${cfg.rotation}deg)`,
                  width:     `${cfg.cardW}px`,
                  padding:   "12px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`${collection.name} — photo ${index + 1}`}
                  draggable={false}
                  style={{
                    width:   `${photoW}px`,
                    height:  "auto",
                    display: "block",
                  }}
                />
              </div>
            )
          })}
        </DragElements>
      )}
    </div>
  )
}
