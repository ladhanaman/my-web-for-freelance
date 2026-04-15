'use client'

import { type ChangeEvent, type FormEvent, type KeyboardEvent, useEffect, useRef } from 'react'
import { SendHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ParallaxComposerProps {
  value: string
  isSubmitting?: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

export function ParallaxComposer({
  value,
  isSubmitting = false,
  onChange,
  onSubmit,
}: ParallaxComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize: shrink and grow with content
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  // Re-focus after AI responds
  useEffect(() => {
    if (!isSubmitting) {
      textareaRef.current?.focus()
    }
  }, [isSubmitting])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-[#8feaa2]/10 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex items-end gap-2">
        <span className="mb-[0.6rem] shrink-0 select-none font-mono text-sm text-[#5a9468]">{'>'}</span>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          disabled={isSubmitting}
          rows={1}
          autoFocus
          placeholder="describe what you're feeling..."
          onKeyDown={handleKeyDown}
          className="max-h-32 w-full resize-none overflow-y-auto bg-transparent py-2 text-[0.88rem] text-[#f0fff3] placeholder:text-[#4d7a5a] outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={isSubmitting || value.trim().length === 0}
          className="mb-0.5 h-8 min-w-8 shrink-0 rounded border border-[#3d6648]/50 bg-[#0b160e]/70 px-2 font-mono text-[0.7rem] text-[#7ecf94] shadow-none hover:border-[#78d58e]/60 hover:bg-[#112016]/80 disabled:opacity-30"
        >
          <SendHorizontal className="size-3.5" />
        </Button>
      </div>
      <p className="mt-1 font-mono text-[0.6rem] tracking-[0.14em] text-[#3d5a44] uppercase">
        shift+enter for new line
      </p>
    </form>
  )
}
