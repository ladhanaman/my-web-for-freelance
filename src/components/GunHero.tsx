"use client"

import { useRef, useEffect, Suspense, useMemo, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useGLTF, Environment } from "@react-three/drei"
import * as THREE from "three"

// ─── Tuning ────────────────────────────────────────────────────────────────
// rotation.y = -π/2   →  barrel (Z-axis) maps to screen +X (pointing right)
// rotation.x = 0.06   →  slight downward tilt for depth / realism
// Phase 1 (t 0→0.55)  →  clockwise Z-rotation, −75° total
// Phase 2 (t 0.3→1)   →  slides left, scales down a touch
// ───────────────────────────────────────────────────────────────────────────

function GunModel({ progress }: { progress: React.RefObject<number> }) {
  const { scene }     = useGLTF("/flintlock_pistol.glb")
  const cloned        = useMemo(() => scene.clone(true), [scene])
  const group         = useRef<THREE.Group>(null)
  const { viewport }  = useThree()
  const baseScale     = useRef(1)

  // Auto-scale so gun fills ~85 % of viewport width.
  // Gun length ≈ 2 world units along X after Y-rotation.
  useEffect(() => {
    baseScale.current = (viewport.width * 0.85) / 2.0
    group.current?.scale.setScalar(baseScale.current)
  }, [viewport.width])

  useFrame((_, delta) => {
    if (!group.current) return
    const t = progress.current ?? 0
    const S = baseScale.current

    // ── Phase 1: clockwise rotation (0 → 0.55) ───────────────────
    const rp = Math.min(t / 0.55, 1)
    const re = rp < 0.5 ? 2 * rp * rp : 1 - (-2 * rp + 2) ** 2 / 2
    const tRz = -Math.PI * 0.42 * re   // ≈ −75.6° (clockwise)

    // ── Phase 2: slide left + slight scale-down (0.3 → 1) ────────
    const mp = Math.max(0, Math.min((t - 0.3) / 0.7, 1))
    const me = mp < 0.5 ? 2 * mp * mp : 1 - (-2 * mp + 2) ** 2 / 2
    const tX = -viewport.width  * 0.27 * me
    const tY =  viewport.height * 0.03 * me
    const tS = S * (1 - 0.15 * me)

    // Spring coefficient — controls how "laggy" the follow is
    const k = 1 - Math.pow(0.012, delta)

    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, tRz, k)
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, tX,  k)
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, tY,  k)
    group.current.scale.setScalar(
      THREE.MathUtils.lerp(group.current.scale.x, tS, k)
    )
  })

  return (
    <group ref={group} rotation={[0.06, -Math.PI / 2, 0]} scale={1}>
      <primitive object={cloned} />
    </group>
  )
}

// ── Main export ─────────────────────────────────────────────────────────────
export default function GunHero() {
  const containerRef   = useRef<HTMLDivElement>(null)
  const infoRef        = useRef<HTMLDivElement>(null)
  const scrollHintRef  = useRef<HTMLDivElement>(null)
  const scrollProgress = useRef<number>(0)

  const onScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const scrolled    = Math.max(0, -(el.getBoundingClientRect().top))
    const totalScroll = el.offsetHeight - window.innerHeight
    const t           = Math.min(1, scrolled / totalScroll)
    scrollProgress.current = t

    // Info panel: fade + slide in from t = 0.4
    const ip = Math.max(0, Math.min((t - 0.4) / 0.35, 1))
    if (infoRef.current) {
      infoRef.current.style.opacity       = String(ip)
      infoRef.current.style.transform     = `translateY(-50%) translateX(${(1 - ip) * 60}px)`
      infoRef.current.style.pointerEvents = ip > 0.05 ? "auto" : "none"
    }
    // Scroll hint fades out fast
    if (scrollHintRef.current) {
      scrollHintRef.current.style.opacity = String(Math.max(0, 1 - ip * 5))
    }
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [onScroll])

  return (
    // 280 vh gives the scroll "travel distance" for the animation
    <div ref={containerRef} style={{ height: "280vh", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>

        {/* ── Three.js Canvas ──────────────────────────────────────── */}
        <Canvas
          camera={{ position: [0, 0, 7], fov: 38 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 1.5]}
          style={{ position: "absolute", inset: 0, zIndex: 1 }}
        >
          <Suspense fallback={null}>
            {/* Warm terracotta key light */}
            <ambientLight intensity={0.4} color="#f2ede8" />
            <directionalLight
              position={[1, 4, 6]}
              intensity={3.5}
              color="#f2ede8"
              castShadow
            />
            {/* Accent orange fill from the left */}
            <pointLight position={[-3, 1, 4]}  intensity={3.0} color="#C07548" />
            {/* Deep warm back fill */}
            <pointLight position={[4, -3, 2]}  intensity={1.5} color="#7a3018" />
            {/* Soft top spot */}
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

        {/* ── Info panel (right side, appears on scroll) ───────────── */}
        <div
          ref={infoRef}
          style={{
            position: "absolute",
            top: "50%",
            right: "6%",
            transform: "translateY(-50%) translateX(60px)",
            width: "min(38%, 440px)",
            opacity: 0,
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div style={{
            borderLeft: "2px solid rgba(192,117,72,0.5)",
            paddingLeft: "1.75rem",
          }}>
            <p style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "#C07548",
              marginBottom: "0.75rem",
            }}>
              Precision · Intelligence · Speed
            </p>

            <h2 style={{
              fontSize: "clamp(1.5rem, 2.8vw, 2.4rem)",
              fontWeight: 800,
              lineHeight: 1.12,
              color: "#f2ede8",
              marginBottom: "1.2rem",
              letterSpacing: "-0.025em",
            }}>
              AI Systems Built<br />to Hit the Mark
            </h2>

            <p style={{
              fontSize: "0.9rem",
              color: "#8c7f74",
              lineHeight: 1.8,
              marginBottom: "1.75rem",
            }}>
              We design and deploy intelligent automation — from autonomous
              agents to end-to-end RAG pipelines — engineered for precision
              and built to scale.
            </p>

            <ul style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 2rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.65rem",
            }}>
              {[
                "AI Agents & Autonomous Workflows",
                "RAG Systems & Knowledge Bases",
                "n8n Automation Pipelines",
                "AI Strategy & Rapid Prototyping",
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    fontSize: "0.875rem",
                    color: "#c8beb4",
                  }}
                >
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#C07548",
                    flexShrink: 0,
                    boxShadow: "0 0 8px rgba(192,117,72,0.65)",
                  }} />
                  {item}
                </li>
              ))}
            </ul>

            <a
              href="#contact"
              className="gun-cta"
            >
              Start a Project →
            </a>
          </div>
        </div>

        {/* ── Scroll hint ──────────────────────────────────────────── */}
        <div
          ref={scrollHintRef}
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
            opacity: 1,
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
