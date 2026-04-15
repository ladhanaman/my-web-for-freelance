import assert from 'node:assert/strict'
import test from 'node:test'

import { buildParallaxChatTurnFromIntent } from './orchestrator'
import type { IntentSnapshot } from './types'

const createIntent = (overrides: Partial<IntentSnapshot>): IntentSnapshot => ({
  moods: [],
  themes: [],
  tones: [],
  keywords: [],
  confidence: 0,
  source: 'deterministic',
  ...overrides,
})

test('recommends poems when Groq provides a confident signal', () => {
  const result = buildParallaxChatTurnFromIntent(
    { excludedPoemIds: [], message: 'feeling something soft tonight', history: [] },
    createIntent({
      moods: ['soft', 'hopeful'],
      confidence: 0.45,
      source: 'groq',
    }),
  )

  assert.equal(result.nextAction, 'recommend')
  assert.equal(result.showLoader, true)
  assert.ok(result.matches.length >= 1)
})

test('recommends short poems when deterministic finds mood + length signal', () => {
  const result = buildParallaxChatTurnFromIntent(
    { excludedPoemIds: [], message: 'something short and soft', history: [] },
    createIntent({
      moods: ['soft'],
      desiredLength: 'short',
      confidence: 0.44,
      source: 'deterministic',
    }),
  )

  assert.equal(result.nextAction, 'recommend')
  assert.equal(result.matches[0]?.poem.length, 'short')
})

test('keeps follow-up mode when there is no usable signal', () => {
  const result = buildParallaxChatTurnFromIntent(
    { excludedPoemIds: [], message: 'just browsing', history: [] },
    createIntent({
      confidence: 0.1,
      source: 'deterministic',
    }),
  )

  assert.equal(result.nextAction, 'ask_followup')
  assert.equal(result.matches.length, 0)
  assert.equal(result.showLoader, false)
})

test('recommends after repeated deflection (2+ turns)', () => {
  const history = [
    { id: '1', role: 'user' as const, content: 'nothing', createdAt: '' },
    { id: '2', role: 'assistant' as const, content: 'Soft or heavy?', createdAt: '' },
    { id: '3', role: 'user' as const, content: 'idk', createdAt: '' },
    { id: '4', role: 'assistant' as const, content: 'No pressure.', createdAt: '' },
  ]
  const result = buildParallaxChatTurnFromIntent(
    { excludedPoemIds: [], message: 'nothing', history },
    createIntent({ confidence: 0.1, source: 'deterministic' }),
  )

  assert.equal(result.nextAction, 'recommend')
  assert.ok(result.matches.length >= 1)
})
