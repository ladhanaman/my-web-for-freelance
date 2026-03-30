"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { SECTION_IDS, PAGE_NAMES } from "@/lib/collections"

const SECTIONS = [
  { id: SECTION_IDS.hero,        label: "Home"             },
  { id: SECTION_IDS.gun,         label: "Gun"              },
  { id: SECTION_IDS.photography, label: PAGE_NAMES.photography },
  { id: SECTION_IDS.onekoCat,    label: "Oneko-Cat"        },
] as const

type SectionId = (typeof SECTIONS)[number]["id"]

export default function NavBar() {
  const [active,  setActive]  = useState<SectionId>("home")
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  // Runs synchronously before the browser paints — kills scroll-position flash on reload
  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual"

    const isReload =
      performance?.getEntriesByType?.('navigation')?.[0]?.type === 'reload'

    if (isReload || !window.location.hash) {
      window.scrollTo(0, 0)
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y  = window.scrollY
      const vh = window.innerHeight

      // Always visible on the gun section; otherwise hide on scroll-down
      const workEl = document.getElementById("work")
      const onGun  = workEl
        ? workEl.getBoundingClientRect().top <= 0 &&
          workEl.getBoundingClientRect().bottom > 0
        : false

      setVisible(onGun || y < lastY.current || y < vh * 0.1)
      lastY.current = y

      // Active section: whichever section's top is closest above mid-viewport
      let current: SectionId = "home"
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top <= vh * 0.45) current = id
      }
      setActive(current)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <nav
      aria-label="Site navigation"
      style={{
        position:   "fixed",
        top:        0,
        left:       0,
        right:      0,
        zIndex:     200,
        display:    "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding:    "1.5rem 2.4rem",
        // Translate up when hidden, down when visible
        transform:  visible ? "translateY(0)" : "translateY(-110%)",
        transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
        // Subtle top gradient so nav text stays readable over any background
        background: "linear-gradient(to bottom, rgba(16,14,12,0.72) 0%, transparent 100%)",
        backdropFilter: "blur(0px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Brand mark — pixel font, small */}
      <button
        onClick={() => scrollTo("home")}
        style={{
          fontFamily:    "var(--font-press-start), monospace",
          fontSize:      "0.65rem",
          color:         "#C07548",
          letterSpacing: "0.08em",
          background:    "none",
          border:        "none",
          cursor:        "pointer",
          padding:       0,
          lineHeight:    1,
        }}
      >
        IK
      </button>

      {/* Section links */}
      <ul
        role="list"
        style={{
          display:    "flex",
          gap:        "3rem",
          listStyle:  "none",
          margin:     0,
          padding:    0,
        }}
      >
        {SECTIONS.map(({ id, label }) => {
          const isActive = active === id
          return (
            <li key={id}>
              <button
                onClick={() => scrollTo(id)}
                style={{
                  fontSize:      "0.71rem",
                  fontWeight:    600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color:         isActive ? "#C07548" : "#5a5048",
                  background:    "none",
                  border:        "none",
                  cursor:        "pointer",
                  padding:       0,
                  position:      "relative",
                  transition:    "color 0.2s ease",
                }}
              >
                {label}
                {/* Active underline dot */}
                <span
                  style={{
                    position:   "absolute",
                    bottom:     "-4px",
                    left:       "50%",
                    transform:  `translateX(-50%) scaleX(${isActive ? 1 : 0})`,
                    width:      "100%",
                    height:     "1px",
                    background: "#C07548",
                    transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1)",
                    transformOrigin: "center",
                  }}
                />
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
