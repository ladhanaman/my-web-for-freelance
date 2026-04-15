import type { ChatMessage, RankedPoem } from '@/lib/parallax/types'

// ── Shared base ──────────────────────────────────────────────────────────────

type BaseFields = {
  messages: ChatMessage[]
  seenPoemIds: string[]
  matches: RankedPoem[]
  matchCycleId: string | null
}

// ── Discriminated state union ─────────────────────────────────────────────────
//
// Every phase has *only* the fields it actually needs.
// This guarantees, at the type level, that e.g. selectedPoemId can never be
// null in 'poem', and that error can't bleed into 'results'.

export type ExperienceState =
  | (BaseFields & { phase: 'idle' })
  | (BaseFields & { phase: 'chatting' })
  | (BaseFields & { phase: 'submitting' })
  | (BaseFields & { phase: 'awaiting_loader' })
  | (BaseFields & { phase: 'results' })
  | (BaseFields & { phase: 'poem'; selectedPoemId: string })
  | (BaseFields & { phase: 'error'; error: string })

// ── Actions ───────────────────────────────────────────────────────────────────

export type ExperienceAction =
  | { type: 'SUBMIT_START'; userMessage: ChatMessage }
  | { type: 'RESPONSE_CHAT'; assistantMessage: ChatMessage }
  | { type: 'RESPONSE_RECOMMEND'; assistantMessage: ChatMessage; matches: RankedPoem[]; matchCycleId: string | null }
  | { type: 'SUBMIT_FAILED'; error: string }
  | { type: 'SUBMIT_SILENT' }
  | { type: 'LOADER_COMPLETE' }
  | { type: 'OPEN_POEM'; poemId: string }
  | { type: 'BACK_FROM_POEM' }

// ── Initial state ─────────────────────────────────────────────────────────────

export const INITIAL_EXPERIENCE_STATE: ExperienceState = {
  phase: 'idle',
  messages: [],
  seenPoemIds: [],
  matches: [],
  matchCycleId: null,
}

// ── Reducer ───────────────────────────────────────────────────────────────────

export function experienceReducer(
  state: ExperienceState,
  action: ExperienceAction,
): ExperienceState {
  // Extract base fields once so each case can spread them without touching
  // phase-specific extras (selectedPoemId, error) from the previous state.
  const base: BaseFields = {
    messages: state.messages,
    seenPoemIds: state.seenPoemIds,
    matches: state.matches,
    matchCycleId: state.matchCycleId,
  }

  switch (action.type) {
    case 'SUBMIT_START':
      return {
        ...base,
        phase: 'submitting',
        messages: [...base.messages, action.userMessage],
      }

    case 'RESPONSE_CHAT':
      // Keep matches visible if this was a refinement conversation, but hide
      // the aside by going to 'chatting' (matches only show in 'results'/'poem').
      return {
        ...base,
        phase: 'chatting',
        messages: [...base.messages, action.assistantMessage],
      }

    case 'RESPONSE_RECOMMEND': {
      const seenPoemIds = Array.from(
        new Set([...base.seenPoemIds, ...action.matches.map(m => m.poem.id)]),
      )
      return {
        phase: 'awaiting_loader',
        messages: [...base.messages, action.assistantMessage],
        seenPoemIds,
        matches: action.matches,
        matchCycleId: action.matchCycleId,
      }
    }

    case 'SUBMIT_FAILED':
      return { ...base, phase: 'error', error: action.error }

    case 'SUBMIT_SILENT':
      // Groq was unreachable — silently return to chatting without an assistant message
      return { ...base, phase: 'chatting' }

    case 'LOADER_COMPLETE':
      if (state.phase !== 'awaiting_loader') return state
      return { ...base, phase: 'results' }

    case 'OPEN_POEM':
      return { ...base, phase: 'poem', selectedPoemId: action.poemId }

    case 'BACK_FROM_POEM':
      // Guaranteed to have matches (only reachable from 'poem' which requires
      // going through 'results' first), but the fallback keeps TS happy.
      if (base.matches.length > 0) {
        return { ...base, phase: 'results' }
      }
      return { ...base, phase: 'chatting' }

    default:
      return state
  }
}
