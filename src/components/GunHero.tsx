"use client"

import { useRef, useEffect, useLayoutEffect, Suspense, useMemo, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useGLTF, Environment } from "@react-three/drei"
import * as THREE from "three"

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION SPEC
//   Phase: 200 vh container, 100 vh sticky panel → 100 vh of scroll travel
//   t = 0  : gun centered, full-width, showing side profile (barrel right)
//   t = 1  : gun rotated 150° on Y-axis, scaled to 70%, shifted right
//   All three transforms share one easing curve — they start and finish together.
// ─────────────────────────────────────────────────────────────────────────────

const ROT_Y_DELTA = 155 * (Math.PI / 180)   // 150° vertical-axis spin
const SCALE_END = 0.70                      // 30 % size reduction
const X_SHIFT = 0.12                      // rightward shift as fraction of viewport width
const SPRING = 12                        // exponential spring stiffness (higher = snappier)
const SNAP_THRESH = 0.005                     // snap to exact target near t=0 and t=1

// Cubic ease-in-out — smooth S-curve, same curve drives all three transforms
function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

// ─── 3-D gun ─────────────────────────────────────────────────────────────────
function GunModel({ progress }: { progress: { current: number } }) {
  const { scene } = useGLTF("/flintlock_pistol.glb")
  const cloned = useMemo(() => scene.clone(true), [scene])
  const group = useRef<THREE.Group>(null)
  const { viewport } = useThree()

  // Gun barrel runs along the model's Z-axis.
  // rotation.y = -π/2 maps that onto screen +X (barrel facing right at t=0).
  // Length ≈ 2 world units → fill ~88 % of viewport width.
  const baseScale = useRef(1)

  // useLayoutEffect fires before paint → no scale-flash on first frame
  useLayoutEffect(() => {
    const s = (viewport.width * 0.88) / 2.0
    baseScale.current = s
    if (group.current) group.current.scale.setScalar(s)
  }, [viewport.width])

  // Smoothed animated state (driven toward scroll-derived targets each frame)
  const cur = useRef({ rotY: -Math.PI / 2, scale: 1, x: 0 })

  useFrame((_, delta) => {
    if (!group.current) return

    const t = Math.max(0, Math.min(progress.current, 1))
    const e = ease(t)
    const s = baseScale.current

    // Targets derived from the single easing value
    const tRotY = -Math.PI / 2 + ROT_Y_DELTA * e
    const tScale = s * (1 - (1 - SCALE_END) * e)

    // Perspective-aware right-edge clamp.
    // The handle end (local +Z) world X = sin(tRotY) × scale.
    // The camera is at z=7; the handle sits at world z = cos(tRotY) × scale.
    // Perspective stretches its screen X by factor camZ / (camZ − handleZ).
    const handleWorldX = Math.sin(tRotY) * tScale
    const handleWorldZ = Math.cos(tRotY) * tScale
    const camZ = 7
    const perspFactor = camZ / Math.max(camZ - handleWorldZ, 0.1)
    const projectedRightEdge = (viewport.width * X_SHIFT * e + handleWorldX) * perspFactor
    const overflow = projectedRightEdge - (viewport.width / 2 - viewport.width * 0.04)
    const tX = viewport.width * X_SHIFT * e - Math.max(0, overflow)

    // Snap precisely at rest positions so spring never drifts at endpoints
    if (t <= SNAP_THRESH || t >= 1 - SNAP_THRESH) {
      cur.current.rotY = tRotY
      cur.current.scale = tScale
      cur.current.x = tX
    } else {
      const k = 1 - Math.exp(-SPRING * delta)
      cur.current.rotY = THREE.MathUtils.lerp(cur.current.rotY, tRotY, k)
      cur.current.scale = THREE.MathUtils.lerp(cur.current.scale, tScale, k)
      cur.current.x = THREE.MathUtils.lerp(cur.current.x, tX, k)
    }

    group.current.rotation.y = cur.current.rotY
    group.current.scale.setScalar(cur.current.scale)
    group.current.position.x = cur.current.x
  })

  return (
    // rotation.x: slight downward tilt for a grounded, 3-D feel
    // rotation.y: controlled entirely by useFrame above
    <group ref={group} rotation={[0.06, -Math.PI / 2, 0]}>
      <primitive object={cloned} />
    </group>
  )
}

// ─── Tagline words with their scroll-in windows ──────────────────────────────
// Each word fades + slides up independently, staggered across scroll progress.
const WORDS = [
  { text: "Precision.", color: "#f2ede8", start: 0.36, end: 0.54 },
  { text: "Intelligence.", color: "#c8beb4", start: 0.50, end: 0.68 },
  { text: "Deployed.", color: "#C07548", start: 0.64, end: 0.82 },
] as const

// ─── Full hero section ────────────────────────────────────────────────────────
export default function GunHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const word0Ref = useRef<HTMLSpanElement>(null)
  const word1Ref = useRef<HTMLSpanElement>(null)
  const word2Ref = useRef<HTMLSpanElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const manifestoRef = useRef<HTMLParagraphElement>(null)
  const scrollProgress = useRef<number>(0)

  const wordRefs = [word0Ref, word1Ref, word2Ref]

  // Inline helper: map t into a 0→1 progress within [start, end]
  const progress = (t: number, start: number, end: number) =>
    Math.max(0, Math.min((t - start) / (end - start), 1))

  const onScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    // scrolled: how far the container top has passed the viewport top (0 when section first pins)
    const scrolled   = Math.max(0, -(el.getBoundingClientRect().top))

    // Animation starts immediately when section pins — 100 vh of scroll travel
    const animTravel = window.innerHeight
    const t          = animTravel > 0 ? Math.min(1, scrolled / animTravel) : 0

    scrollProgress.current = t

    // Scroll hint fades over the first 50% of hero scroll travel
    if (hintRef.current) {
      const hintProgress = scrolled / (animTravel * 0.50)
      hintRef.current.style.opacity = String(Math.max(0, 1 - hintProgress))
    }

    // Words: fade + slide up individually
    WORDS.forEach(({ start, end }, i) => {
      const p = progress(t, start, end)
      const ref = wordRefs[i].current
      if (!ref) return
      ref.style.opacity = String(p)
      ref.style.transform = `translateY(${(1 - p) * 32}px)`
    })

    // Divider line — scales in just before the manifesto
    const dp = progress(t, 0.76, 0.87)
    if (dividerRef.current) {
      dividerRef.current.style.opacity = String(dp)
      dividerRef.current.style.transform = `scaleX(${dp})`
    }

    // Manifesto line — appears after all three words have settled
    const mp = progress(t, 0.82, 0.96)
    if (manifestoRef.current) {
      manifestoRef.current.style.opacity = String(mp)
      manifestoRef.current.style.transform = `translateY(${(1 - mp) * 18}px)`
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true })
    // Run once on mount in case page loads mid-scroll
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [onScroll])

  return (
    /*
     * 200 vh tall outer container — 100 vh sticky viewport + 100 vh scroll travel.
     * Animation begins the moment the section pins and completes after 100 vh of scrolling.
     *
     * NOTE: no overflow:hidden here — that would break position:sticky
     * in Safari/Chrome.  Clipping is handled at the page level with
     * overflow-x:clip (set on <main> in page.tsx).
     */
    <div ref={containerRef} style={{ height: "200vh" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          // isolation:isolate keeps the Canvas composited correctly
          isolation: "isolate",
        }}
      >

        {/* ── Top gradient: merges with hero's bottom fade ────── */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "32%",
            background: "linear-gradient(to bottom, #100e0c 0%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* ── Canvas ───────────────────────────────────────────── */}
        <Canvas
          camera={{ position: [0, 0, 7], fov: 38 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          dpr={[1, 1.5]}
          style={{ position: "absolute", inset: 0 }}
        >
          <Suspense fallback={null}>
            {/* Warm terracotta key + fill lights */}
            <ambientLight intensity={0.4} color="#f2ede8" />
            <directionalLight
              position={[1, 4, 6]}
              intensity={3.5}
              color="#f2ede8"
              castShadow
            />
            <pointLight position={[-3, 1, 4]} intensity={3.0} color="#C07548" />
            <pointLight position={[4, -3, 2]} intensity={1.5} color="#7a3018" />
            <spotLight
              position={[0, 5, 5]}
              angle={0.4}
              penumbra={0.9}
              intensity={5}
              color="#d4895e"
            />
            <GunModel progress={scrollProgress} />
            <Environment preset="night" />
          </Suspense>
        </Canvas>

        {/* ── Left tagline panel ───────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "6%",
            transform: "translateY(-50%)",
            width: "min(40%, 460px)",
            zIndex: 10,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {/* Three cinematic words */}
          {WORDS.map(({ text, color }, i) => {
            const ref = wordRefs[i]
            return (
              <span
                key={text}
                ref={ref as React.RefObject<HTMLSpanElement>}
                style={{
                  display: "block",
                  fontSize: "clamp(2.6rem, 5.2vw, 5rem)",
                  fontWeight: 800,
                  lineHeight: 1.08,
                  letterSpacing: "-0.04em",
                  color,
                  opacity: 0,
                  transform: "translateY(32px)",
                  // Subtle text shadow for the accent word
                  textShadow: color === "#C07548"
                    ? "0 0 40px rgba(192,117,72,0.35)"
                    : "none",
                }}
              >
                {text}
              </span>
            )
          })}

          {/* Divider */}
          <div
            ref={dividerRef}
            style={{
              marginTop: "1.6rem",
              height: 1,
              width: "3rem",
              background: "rgba(192,117,72,0.5)",
              opacity: 0,
              transform: "scaleX(0)",
              transformOrigin: "left",
            }}
          />

          {/* Manifesto */}
          <p
            ref={manifestoRef}
            style={{
              marginTop: "1rem",
              fontSize: "clamp(1rem, 1.6vw, 1.3rem)",
              fontStyle: "italic",
              color: "#6b5e54",
              lineHeight: 1.6,
              letterSpacing: "0.01em",
              opacity: 0,
              transform: "translateY(18px)",
            }}
          >
            Built for businesses that can&apos;t afford to miss.
          </p>

        </div>

        {/* ── Scroll hint ───────────────────────────────────────── */}
        <div
          ref={hintRef}
          style={{
            position: "absolute",
            bottom: "2.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.45rem",
            zIndex: 10,
          }}
        >
          <span style={{
            fontSize: "0.65rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#5a5048",
          }}>
            Scroll
          </span>
          <div className="scroll-line" />
        </div>

      </div>
    </div>
  )
}
