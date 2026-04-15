'use client'

import type { RankedPoem } from '@/lib/parallax/types'

interface ParallaxMatchCardsProps {
  matches: RankedPoem[]
  onOpen: (poemId: string) => void
}

const toFilename = (title: string) =>
  title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '.poem'

export function ParallaxMatchCards({ matches, onOpen }: ParallaxMatchCardsProps) {
  return (
    <section className="flex h-full flex-col px-5 pb-6 pt-5 sm:px-6">
      {/* Terminal path header */}
      <div className="mb-4">
        <p className="font-mono text-[0.6rem] tracking-[0.28em] text-[#3d6648] uppercase">Signal locked</p>
        <p className="mt-1 font-mono text-[0.72rem] text-[#5a8a65]">
          /archive/poems/
          <span className="ml-1 text-[#78d58e]">[{matches.length} matches]</span>
        </p>
        <h2 className="mt-1.5 font-[var(--font-fraunces)] text-[1.45rem] leading-tight text-[#effff2] sm:text-[1.6rem]">
          Three poems in orbit
        </h2>
      </div>

      {/* Directory listing */}
      <div className="flex flex-col">
        {matches.map((match, index) => {
          const isLast = index === matches.length - 1
          const filename = toFilename(match.poem.title)

          return (
            <div key={match.poem.id}>
              {/* File row */}
              <div className="flex items-baseline gap-2 font-mono">
                <span className="shrink-0 text-[0.78rem] text-[#3d6648]">
                  {isLast ? '└──' : '├──'}
                </span>
                <span className="text-[0.65rem] text-[#4d7a5a]">
                  {String(index + 1).padStart(3, '0')}
                </span>
                <span className="truncate text-[0.78rem] text-[#7ecf94]">{filename}</span>
              </div>

              {/* File body — indented, connected with border-l */}
              <div
                className={`ml-[1.1rem] py-3 pl-4 ${
                  isLast ? '' : 'border-l border-[#3d6648]/40'
                }`}
              >
                <h3 className="font-[var(--font-fraunces)] text-[1.15rem] leading-snug text-[#f0fff2]">
                  {match.poem.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[0.78rem] leading-5 text-[#7aab89] italic">
                  &ldquo;{match.poem.excerpt}&rdquo;
                </p>
                <p className="mt-2 font-mono text-[0.63rem] text-[#4d7a5a]">
                  {match.reasons.join(' · ')}
                </p>
                <button
                  type="button"
                  onClick={() => onOpen(match.poem.id)}
                  className="mt-3 flex items-center gap-2 rounded border border-[#3d6648]/50 bg-[#0b160e]/70 px-3 py-1.5 font-mono text-[0.7rem] text-[#7ecf94] transition-colors hover:border-[#78d58e]/60 hover:bg-[#112016]/80 hover:text-[#b0ecc0]"
                >
                  <span className="text-[#4d7a5a]">$</span>
                  run {filename}
                  <span className="ml-auto text-[#3d6648]">→</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
