"use client"

import Link from "next/link"
import Floating, { FloatingElement } from "@/components/fancy/image/parallax-floating"
import {
  COLLECTIONS,
  GALLERY_BASE_PATH,
  SECTION_IDS,
  type Collection,
} from "@/lib/collections"

// ── Layout slots for collection cards (up to 8, cycles if more)
// top/left are percentage strings relative to the section
// depth controls parallax intensity (higher = moves more)
const SLOTS = [
  { top: "7%",  left: "1%",   rotate: "-4deg", depth: 2.0, width: 172 },
  { top: "3%",  left: "63%",  rotate:  "3deg", depth: 3.5, width: 196 },
  { top: "42%", left: "2%",   rotate: "-6deg", depth: 1.5, width: 152 },
  { top: "32%", left: "71%",  rotate:  "5deg", depth: 2.8, width: 180 },
  { top: "62%", left: "66%",  rotate: "-3deg", depth: 2.5, width: 168 },
  { top: "70%", left: "13%",  rotate:  "7deg", depth: 3.0, width: 148 },
  { top: "12%", left: "48%",  rotate: "-2deg", depth: 2.2, width: 164 },
  { top: "72%", left: "42%",  rotate:  "4deg", depth: 3.5, width: 184 },
] as const

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link
      href={`${GALLERY_BASE_PATH}/${collection.slug}`}
      className="collection-card"
      style={{
        display:        "block",
        background:     "#1a1612",
        border:         "1px solid rgba(192,117,72,0.15)",
        borderRadius:   4,
        overflow:       "hidden",
        textDecoration: "none",
        userSelect:     "none",
      }}
    >
      {/* Photo area — portrait aspect ratio */}
      <div
        style={{
          position:    "relative",
          aspectRatio: "3/4",
          width:       "100%",
          background:  "#0e0c0a",
          overflow:    "hidden",
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
            display:        collection.coverPhoto ? "none" : "flex",
            position:       "absolute",
            inset:          0,
            alignItems:     "center",
            justifyContent: "center",
            background:     "linear-gradient(135deg, #1a1612 0%, #0e0c0a 100%)",
          }}
        >
          <span style={{ color: "rgba(192,117,72,0.25)", fontSize: "2rem" }}>✦</span>
        </div>
      </div>

      {/* Label row */}
      <div
        style={{
          padding:        "0.7rem 0.85rem",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize:      "0.68rem",
            fontWeight:    600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color:         "#8c7f74",
          }}
        >
          {collection.name}
        </span>
        <span style={{ color: "rgba(192,117,72,0.5)", fontSize: "0.75rem" }}>→</span>
      </div>
    </Link>
  )
}

export default function Framescape() {
  return (
    <section
      id={SECTION_IDS.photography}
      style={{
        position:   "relative",
        height:     "100vh",
        background: "#100e0c",
        overflow:   "hidden",
      }}
    >
      {/* Blend gradient — merges with GunHero bottom */}
      <div
        aria-hidden
        style={{
          position:      "absolute",
          top:           0,
          left:          0,
          right:         0,
          height:        "22%",
          background:    "linear-gradient(to bottom, #100e0c 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex:        5,
        }}
      />

      {/* Blend gradient — merges with Contact section below */}
      <div
        aria-hidden
        style={{
          position:      "absolute",
          bottom:        0,
          left:          0,
          right:         0,
          height:        "18%",
          background:    "linear-gradient(to bottom, transparent 0%, #100e0c 100%)",
          pointerEvents: "none",
          zIndex:        5,
        }}
      />

      {/* Floating collection card layer */}
      <Floating sensitivity={0.9} easingFactor={0.045} className="z-[4]">
        {COLLECTIONS.slice(0, SLOTS.length).map((collection, i) => {
          const slot = SLOTS[i % SLOTS.length]
          return (
            <FloatingElement
              key={collection.slug}
              depth={slot.depth}
              style={{ top: slot.top, left: slot.left, width: slot.width }}
            >
              {/* Rotation wrapper — FloatingElement controls translate3d, this handles tilt */}
              <div style={{ transform: `rotate(${slot.rotate})` }}>
                <CollectionCard collection={collection} />
              </div>
            </FloatingElement>
          )
        })}
      </Floating>

      {/* Radial backdrop behind the title so text stays readable over cards */}
      <div
        aria-hidden
        style={{
          position:      "absolute",
          inset:         0,
          background:    "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(16,14,12,0.78) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex:        8,
        }}
      />

      {/* Section title — centered, rendered above floating cards */}
      <div
        style={{
          position:       "absolute",
          inset:          0,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          zIndex:         10,
          pointerEvents:  "none",
          textAlign:      "center",
          padding:        "0 1.5rem",
        }}
      >
        {/* Section label with dividers */}
        <div
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "0.85rem",
            marginBottom: "1.1rem",
          }}
        >
          <div style={{ height: 1, width: 40, background: "rgba(192,117,72,0.45)" }} />
          <span
            style={{
              fontSize:      "0.68rem",
              fontWeight:    700,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color:         "#C07548",
            }}
          >
            Photography
          </span>
          <div style={{ height: 1, width: 40, background: "rgba(192,117,72,0.45)" }} />
        </div>

        {/* Main title */}
        <h2
          style={{
            fontSize:      "clamp(3rem, 7vw, 6.5rem)",
            fontWeight:    800,
            letterSpacing: "-0.04em",
            lineHeight:    1,
            color:         "#f2ede8",
            margin:        0,
          }}
        >
          Framescape
        </h2>

        {/* Subtitle */}
        <p
          style={{
            marginTop:     "1.2rem",
            fontSize:      "clamp(0.85rem, 1.4vw, 1.05rem)",
            fontStyle:     "italic",
            color:         "#5a5048",
            letterSpacing: "0.02em",
            lineHeight:    1.5,
          }}
        >
          A visual record. Click any collection to explore.
        </p>
      </div>
    </section>
  )
}
