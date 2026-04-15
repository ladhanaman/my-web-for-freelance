'use client'

import dynamic from 'next/dynamic'
import { ParallaxExperience } from '@/components/parallax/ParallaxExperience'

const FaultyTerminal = dynamic(() => import('@/components/FaultyTerminal'), {
  ssr: false,
})

export default function ParallaxPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#100e0c]">
      <div className="fixed inset-0">
        <FaultyTerminal
          scale={1.5}
          gridMul={[2, 1]}
          digitSize={1.2}
          timeScale={0.5}
          pause={false}
          scanlineIntensity={0.5}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          chromaticAberration={0}
          dither={0}
          curvature={0.1}
          tint="#A7EF9E"
          mouseReact
          mouseStrength={0.5}
          pageLoadAnimation
          brightness={0.6}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(167,239,158,0.08),transparent_32%),radial-gradient(circle_at_78%_20%,rgba(167,239,158,0.06),transparent_26%),linear-gradient(180deg,rgba(8,12,10,0.18),rgba(8,12,10,0.72))]" />
        <div className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen [background-image:linear-gradient(to_bottom,rgba(167,239,158,0.08)_1px,transparent_1px)] [background-size:100%_5px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(167,239,158,0.16),transparent_70%)] blur-3xl" />
      </div>

      <ParallaxExperience />
    </main>
  )
}
