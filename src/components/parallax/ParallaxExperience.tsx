'use client'

import { useEffect, useReducer, useRef, useState } from 'react'
import { ParallaxComposer } from '@/components/parallax/ParallaxComposer'
import { ParallaxLoaderOverlay } from '@/components/parallax/ParallaxLoaderOverlay'
import { ParallaxMatchCards } from '@/components/parallax/ParallaxMatchCards'
import { ParallaxMessageList } from '@/components/parallax/ParallaxMessageList'
import { ParallaxPoemView } from '@/components/parallax/ParallaxPoemView'
import { ParallaxStarterChips } from '@/components/parallax/ParallaxStarterChips'
import {
  experienceReducer,
  INITIAL_EXPERIENCE_STATE,
} from '@/lib/parallax/experienceReducer'
import { PARALLAX_POEM_COUNT, PARALLAX_STARTER_CHIPS } from '@/lib/parallax/constants'
import type { ChatMessage, ClientMetadata, ParallaxChatResponse } from '@/lib/parallax/types'

const SESSION_STORAGE_KEY = 'parallax-session-id'

const createChatMessage = (role: ChatMessage['role'], content: string): ChatMessage => ({
  id: `${role}-${crypto.randomUUID()}`,
  role,
  content,
  createdAt: new Date().toISOString(),
})

const collectClientMetadata = (): ClientMetadata => {
  if (typeof window === 'undefined') return {}
  const nav = window.navigator as Navigator & { userAgentData?: { platform?: string } }
  return {
    userAgent: nav.userAgent,
    language: nav.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: nav.userAgentData?.platform ?? nav.platform ?? 'unknown',
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  }
}

export function ParallaxExperience() {
  const [state, dispatch] = useReducer(experienceReducer, INITIAL_EXPERIENCE_STATE)
  const [draft, setDraft] = useState('')

  // Session ID never causes a re-render — a ref is sufficient.
  const sessionIdRef = useRef<string>('')
  // Coordinates the loader animation promise with the async submit flow.
  const loaderResolverRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (existing) {
      sessionIdRef.current = existing
      return
    }
    const next = `parallax_${window.crypto.randomUUID()}`
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, next)
    sessionIdRef.current = next
  }, [])

  useEffect(() => {
    return () => {
      loaderResolverRef.current?.()
      loaderResolverRef.current = null
    }
  }, [])

  const getOrCreateSessionId = (): string => {
    if (sessionIdRef.current) return sessionIdRef.current
    const next = `parallax_${crypto.randomUUID()}`
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, next)
    sessionIdRef.current = next
    return next
  }

  const waitForLoader = () =>
    new Promise<void>(resolve => {
      loaderResolverRef.current = resolve
    })

  const handleLoaderComplete = () => {
    loaderResolverRef.current?.()
    loaderResolverRef.current = null
    dispatch({ type: 'LOADER_COMPLETE' })
  }

  const submitMessage = async (preset?: string) => {
    const content = (preset ?? draft).trim()
    if (!content || state.phase === 'submitting' || state.phase === 'awaiting_loader') return

    const sessionId = getOrCreateSessionId()
    const userMessage = createChatMessage('user', content)
    const nextHistory = [...state.messages, userMessage].slice(-12)

    setDraft('')
    dispatch({ type: 'SUBMIT_START', userMessage })

    try {
      const response = await fetch('/api/parallax/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: content,
          history: nextHistory,
          metadata: collectClientMetadata(),
          excludedPoemIds: state.seenPoemIds,
        }),
      })

      const payload = (await response.json()) as unknown

      if (!response.ok) {
        const err = payload as { error?: string }
        throw new Error(err.error ?? 'Failed to process the parallax chat request')
      }

      const result = payload as ParallaxChatResponse
      const assistantMessage = createChatMessage('assistant', result.reply)

      if (result.nextAction === 'recommend') {
        dispatch({
          type: 'RESPONSE_RECOMMEND',
          assistantMessage,
          matches: result.matches,
          matchCycleId: result.matchCycleId,
        })
        await waitForLoader()
      } else {
        dispatch({ type: 'RESPONSE_CHAT', assistantMessage })
      }
    } catch (err) {
      console.error('[parallax-experience] submit error:', err)
      dispatch({
        type: 'SUBMIT_FAILED',
        error: err instanceof Error ? err.message : 'Something went wrong.',
      })
    }
  }

  const openPoem = (poemId: string) => {
    dispatch({ type: 'OPEN_POEM', poemId })

    const sessionId = sessionIdRef.current
    const { matchCycleId } = state
    if (!matchCycleId || !sessionId) return

    void fetch('/api/parallax/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, matchCycleId, poemId }),
    }).catch(err => {
      console.error('[parallax-experience] select error:', err)
    })
  }

  // ── Derived UI values ───────────────────────────────────────────────────────

  const { phase, messages, matches } = state

  // Aside is visible whenever matches exist and we're not in a pure-chat phase.
  const hasMatches =
    matches.length > 0 && phase !== 'idle' && phase !== 'chatting' && phase !== 'error'

  const isSubmitting = phase === 'submitting'
  const isBusy = phase === 'submitting' || phase === 'awaiting_loader'
  const isLoaderVisible = phase === 'awaiting_loader'
  const error = phase === 'error' ? state.error : null

  // selectedPoemId is only present on the 'poem' phase — no null-checking needed.
  const selectedMatch =
    phase === 'poem'
      ? (matches.find(m => m.poem.id === state.selectedPoemId) ?? null)
      : null

  return (
    <>
      <ParallaxLoaderOverlay visible={isLoaderVisible} onComplete={handleLoaderComplete} />

      {selectedMatch && phase === 'poem' ? (
        <ParallaxPoemView
          match={selectedMatch}
          onBack={() => dispatch({ type: 'BACK_FROM_POEM' })}
        />
      ) : null}

      <section className="relative z-10 flex min-h-screen items-center justify-center px-3 py-4 sm:px-5 sm:py-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[8%] top-[16%] h-44 w-44 rounded-full bg-[#78d58e]/10 blur-3xl" />
          <div className="absolute bottom-[12%] right-[10%] h-56 w-56 rounded-full bg-[#78d58e]/8 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-[70rem]">
          <div className="pointer-events-none absolute -inset-2 rounded-[34px] bg-[radial-gradient(circle_at_top,rgba(143,234,162,0.1),transparent_35%),radial-gradient(circle_at_bottom,rgba(143,234,162,0.06),transparent_35%)] blur-2xl" />

          <div className="relative overflow-hidden rounded-[30px] border border-[#8feaa2]/12 bg-[linear-gradient(180deg,rgba(7,13,10,0.82),rgba(7,11,9,0.72))] shadow-[0_24px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(143,234,162,0.07),transparent_28%,transparent_72%,rgba(143,234,162,0.04))]" />
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_bottom,rgba(143,234,162,0.05)_1px,transparent_1px)] [background-size:100%_5px]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8feaa2]/60 to-transparent" />
              {hasMatches ? (
                <div className="absolute inset-y-0 left-[36%] hidden w-px bg-gradient-to-b from-transparent via-[#8feaa2]/16 to-transparent lg:block" />
              ) : null}
            </div>

            <header className="relative border-b border-[#8feaa2]/10 px-5 py-5 text-center sm:px-8 sm:py-6">
              <p className="font-mono text-[0.63rem] tracking-[0.35em] text-[#63a670] uppercase">Parallax</p>
              <h1 className="mt-2 font-[var(--font-fraunces)] text-[2rem] leading-[1.05] text-[#edffee] sm:text-[2.6rem]">
                A terminal for <span className="text-[#93ebb0]">poem hunting.</span><span className="animate-pulse text-[#78d58e]">_</span>
              </h1>
              <div className="mt-3 flex items-center justify-center gap-3 font-mono text-[0.6rem] tracking-[0.14em] text-[#3d6648] uppercase sm:gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-1.5 animate-pulse rounded-full bg-[#78d58e]" />
                  Archive online
                </span>
                <span className="text-[#2d4a35]">·</span>
                <span>{PARALLAX_POEM_COUNT} poems indexed</span>
                <span className="text-[#2d4a35]">·</span>
                <span>Session active</span>
              </div>
            </header>

            <div className="relative lg:flex">
              <div
                className={`relative min-w-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  hasMatches ? 'lg:w-[36%]' : 'w-full lg:mx-auto lg:max-w-[760px]'
                }`}
              >
                <div className="border-b border-[#8feaa2]/8 lg:border-b-0">
                  <ParallaxMessageList messages={messages} isSubmitting={isSubmitting} />
                </div>

                {phase === 'idle' ? (
                  <ParallaxStarterChips
                    chips={PARALLAX_STARTER_CHIPS}
                    disabled={isBusy}
                    onSelect={value => void submitMessage(value)}
                  />
                ) : null}

                {error ? (
                  <div className="px-4 pb-2 sm:px-5">
                    <div className="rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  </div>
                ) : null}

                <ParallaxComposer
                  value={draft}
                  isSubmitting={isBusy}
                  onChange={setDraft}
                  onSubmit={() => void submitMessage()}
                />
              </div>

              <aside
                className={`relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  hasMatches
                    ? 'max-h-[1600px] translate-y-0 border-t border-[#8feaa2]/10 opacity-100 lg:w-[64%] lg:border-l lg:border-t-0'
                    : 'pointer-events-none max-h-0 translate-y-6 border-transparent opacity-0 lg:w-0'
                }`}
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,10,0.44),rgba(6,10,8,0.16))]" />
                <div className="relative flex h-full flex-col">
                  <ParallaxMatchCards matches={matches} onOpen={openPoem} />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
