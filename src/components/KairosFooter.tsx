"use client"

import { SECTION_IDS } from "@/lib/collections"

const NAV_LINKS = [
  { label: "Home", href: `#${SECTION_IDS.hero}` },
  { label: "Gun", href: `#${SECTION_IDS.gun}` },
  { label: "Framescape", href: `#${SECTION_IDS.photography}` }
]

const SOCIAL_LINKS = [
  { label: "Github", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "X (Twitter)", href: "#" },
]

const LINK_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "clamp(1.2rem, 1.9vw, 1.7rem)",
  fontWeight: 500,
  color: "#C07548",
  textDecoration: "none",
  lineHeight: 2.5,
  letterSpacing: "0.01em",
  transition: "opacity 0.18s ease",
}

export default function KairosFooter() {
  return (
    <footer
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 0,
        height: "70vh",
        background: "#fdf8f3",
        backgroundImage: [
          "linear-gradient(rgba(192,117,72,0.08) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(192,117,72,0.08) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "64px 64px",
        overflow: "hidden",
      }}
    >
      {/* ── Nav + Social links — upper right ── */}
      <div
        style={{
          position: "absolute",
          top: "3.5rem",
          right: "4rem",
          display: "flex",
          gap: "clamp(2rem, 5vw, 5rem)",
          alignItems: "flex-start",
        }}
      >
        {/* Page links */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={LINK_STYLE}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.55")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Social links */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {SOCIAL_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={LINK_STYLE}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.55")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Oversized brand name — bottom-left, top 70% visible ── */}
      <h2
        aria-hidden
        className="absolute bottom-0 left-0 translate-y-[15%] scale-y-[1.5]"
        style={{
          fontFamily: "var(--font-press-start), monospace",
          fontStyle: "normal",
          fontWeight: 700,
          fontSize: "clamp(5.28rem, 15.84vw, 17.16rem)",
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: "#C07548",
          whiteSpace: "nowrap",
          userSelect: "none",
          pointerEvents: "none",
          margin: 0,
        }}
      >
        kairos
      </h2>
    </footer>
  )
}
