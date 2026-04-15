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

test('recommends poems for a single hopeful fallback signal', () => {
  const result = buildParallaxChatTurnFromIntent(
    { excludedPoemIds: [] },
    createIntent({
      moods: ['hopeful'],
      confidence: 0.32,
      source: 'deterministic',
    }),
  )

  assert.equal(result.nextAction, 'recommend')
  assert.equal(result.showLoader, true)
  assert.equal(result.matches.length >= 1, true)
})

test('recommends poems for a short-length-only fallback prompt', () => {
  const result = buildParallaxChatTurnFromIntent(
    { excludedPoemIds: [] },
    createIntent({
      desiredLength: 'short',
      confidence: 0.2,
      source: 'deterministic',
    }),
  )

  assert.equal(result.nextAction, 'recommend')
  assert.equal(result.matches[0]?.poem.length, 'short')
})

test('keeps follow-up mode when there is no usable signal', () => {
  const result = buildParallaxChatTurnFromIntent(
    { excludedPoemIds: [] },
    createIntent({
      confidence: 0.1,
      source: 'deterministic',
    }),
  )

  assert.equal(result.nextAction, 'ask_followup')
  assert.equal(result.matches.length, 0)
  assert.equal(result.showLoader, false)
})
