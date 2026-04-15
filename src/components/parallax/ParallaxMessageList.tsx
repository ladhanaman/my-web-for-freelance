'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/lib/parallax/types'

interface ParallaxMessageListProps {
  messages: ChatMessage[]
  isSubmitting?: boolean
}

export function ParallaxMessageList({ messages, isSubmitting = false }: ParallaxMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isSubmitting])

  const isEmpty = messages.length === 0 && !isSubmitting

  return (
    <div className="flex max-h-[44vh] min-h-[220px] flex-col gap-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
      {isEmpty && (
        <div className="flex flex-1 flex-col justify-center py-8">
          <p className="font-mono text-[0.8rem] text-[#8feaa2]/35">~ awaiting input.</p>
          <p className="mt-1 font-mono text-[0.7rem] text-[#8feaa2]/18">
            ~ describe what you&apos;re feeling, the archive listens.
          </p>
        </div>
      )}

      {messages.map(message => {
        const isAssistant = message.role === 'assistant'

        return (
          <div
            key={message.id}
            className={`flex gap-3 border-l-2 py-2.5 pl-3 ${
              isAssistant ? 'border-[#3d7550]/50' : 'border-[#8feaa2]/15'
            }`}
          >
            <span
              className={`shrink-0 select-none font-mono text-[0.82rem] leading-6 ${
                isAssistant ? 'text-[#78d58e]/75' : 'text-[#5a9468]'
              }`}
            >
              {isAssistant ? '~' : '>'}
            </span>
            <p
              className={`text-[0.88rem] leading-6 ${
                isAssistant ? 'text-[#e6f5ea]' : 'text-[#c4e0cc]'
              }`}
            >
              {message.content}
            </p>
          </div>
        )
      })}

      {isSubmitting && (
        <div className="flex gap-3 border-l-2 border-[#3d7550]/50 py-2.5 pl-3">
          <span className="shrink-0 select-none font-mono text-[0.82rem] leading-6 text-[#78d58e]/75">~</span>
          <div className="flex items-center gap-1.5 py-1">
            <span className="size-1.5 animate-bounce rounded-full bg-[#78d58e]/55 [animation-delay:0ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-[#78d58e]/55 [animation-delay:160ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-[#78d58e]/55 [animation-delay:320ms]" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
