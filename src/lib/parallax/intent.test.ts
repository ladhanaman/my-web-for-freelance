import assert from 'node:assert/strict'
import test from 'node:test'

import { buildDeterministicIntent } from './intent'

test('captures hopeful fallback prompts without Groq', () => {
  const intent = buildDeterministicIntent('I need hope')

  assert.equal(intent.moods.includes('hopeful'), true)
  assert.equal(intent.confidence >= 0.3, true)
})

test('captures longing as a romance signal without Groq', () => {
  const intent = buildDeterministicIntent('Love and longing')

  assert.equal(intent.themes.includes('love'), true)
  assert.equal(intent.moods.some(mood => mood === 'romantic' || mood === 'lonely'), true)
})

test('captures late-night thoughts as a night-facing prompt without Groq', () => {
  const intent = buildDeterministicIntent('Late-night thoughts')

  assert.equal(intent.themes.includes('night'), true)
  assert.equal(intent.moods.some(mood => mood === 'dark' || mood === 'restless'), true)
})
