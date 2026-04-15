'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RankedPoem } from '@/lib/parallax/types'

interface ParallaxPoemViewProps {
  match: RankedPoem
  onBack: () => void
}

export function ParallaxPoemView({ match, onBack }: ParallaxPoemViewProps) {
  return (
    <section className="fixed inset-0 z-20 overflow-y-auto bg-[#071009]/92 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_bottom,rgba(143,234,162,0.06)_1px,transparent_1px)] [background-size:100%_5px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-6 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="rounded-full border border-[#8feaa2]/16 bg-[#0e1812]/86 px-4 text-[#f0fff2] hover:bg-[#14221a]"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to chat
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-[34px] border border-[#8feaa2]/12 bg-[linear-gradient(180deg,rgba(8,14,10,0.96),rgba(7,11,9,0.92))] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.32)] sm:p-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8feaa2]/55 to-transparent" />
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_bottom,rgba(143,234,162,0.05)_1px,transparent_1px)] [background-size:100%_5px]" />
          </div>
          <p className="relative text-[0.68rem] tracking-[0.22em] text-[#63a670] uppercase">Parallax poem</p>
          <h1 className="relative mt-3 font-[var(--font-fraunces)] text-4xl leading-tight text-[#effff2] sm:text-5xl">
            {match.poem.title}
          </h1>
          <p className="relative mt-4 max-w-2xl text-base leading-8 text-[#b7d4be]">{match.poem.excerpt}</p>

          <div className="relative mt-6 flex flex-wrap gap-2">
            {match.reasons.map(reason => (
              <span
                key={reason}
                className="rounded-full border border-[#8feaa2]/16 bg-[#102016]/80 px-3 py-1 text-xs text-[#96d9a5]"
              >
                {reason}
              </span>
            ))}
          </div>

          <div className="relative mt-10 rounded-[28px] border border-[#8feaa2]/8 bg-[linear-gradient(180deg,rgba(11,19,14,0.82),rgba(10,16,13,0.62))] px-5 py-6 sm:px-8 sm:py-8">
            <p
              className="whitespace-pre-wrap font-[var(--font-fraunces)] text-[1.08rem] leading-9 text-[#f0fff2] sm:text-[1.18rem] sm:leading-10"
            >
              {match.poem.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
