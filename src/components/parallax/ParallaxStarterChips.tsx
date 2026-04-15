'use client'

interface ParallaxStarterChipsProps {
  chips: readonly string[]
  disabled?: boolean
  onSelect: (value: string) => void
}

export function ParallaxStarterChips({
  chips,
  disabled = false,
  onSelect,
}: ParallaxStarterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-5 pb-4 sm:px-7">
      {chips.map(chip => (
        <button
          key={chip}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(chip)}
          className="rounded-full border border-[#8feaa2]/12 bg-[#0d1711]/78 px-3 py-1.5 text-[0.68rem] font-medium tracking-[0.16em] text-[#92dca1] uppercase transition hover:border-[#8feaa2]/35 hover:bg-[#122118]/92 hover:text-[#f3fff5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
