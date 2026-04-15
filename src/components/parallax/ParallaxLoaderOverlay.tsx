'use client'

import { DotLoader } from '@/components/ui/dot-loader'
import {
  DOT_LOADER_FRAME_DURATION_MS,
  DOT_LOADER_FRAMES,
  DOT_LOADER_REPEAT_COUNT,
} from '@/lib/parallax/constants'

interface ParallaxLoaderOverlayProps {
  visible: boolean
  onComplete?: () => void
}

export function ParallaxLoaderOverlay({ visible, onComplete }: ParallaxLoaderOverlayProps) {
  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#050e07]/92 px-4 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_bottom,rgba(143,234,162,0.05)_1px,transparent_1px)] [background-size:100%_5px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(143,234,162,0.08),transparent_30%),radial-gradient(circle_at_bottom,rgba(143,234,162,0.05),transparent_35%)]" />

      <div className="relative flex items-center gap-5 overflow-hidden rounded-2xl border border-[#8feaa2]/20 bg-[#060f08]/90 px-5 py-4 shadow-[0_20px_70px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8feaa2]/35 to-transparent" />

        <DotLoader
          frames={DOT_LOADER_FRAMES}
          isPlaying={visible}
          duration={DOT_LOADER_FRAME_DURATION_MS}
          repeatCount={DOT_LOADER_REPEAT_COUNT}
          onComplete={onComplete}
          className="gap-0.5"
          dotClassName="size-1.5 rounded-sm bg-[#8feaa2]/15 transition-colors duration-150 [&.active]:bg-[#78d58e]"
        />

        <div className="min-w-0">
          <p className="font-mono text-[0.68rem] tracking-[0.28em] text-[#5a9468] uppercase">searching</p>
          <p className="mt-1 font-medium text-[#f0fff3]">searching Naman&apos;s archive.</p>
          <p className="mt-1 text-sm text-[#7aab89]">finding something close.</p>
        </div>
      </div>
    </div>
  )
}
