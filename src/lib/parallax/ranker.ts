import { POEMS } from './poems'
import type { IntentSnapshot, RankedPoem } from './types'

const SOFT_TONES = new Set(['gentle', 'warm', 'dreamy'])
const HEAVY_MOODS = new Set(['grief', 'dark', 'angry'])

export function rankPoems(intent: IntentSnapshot, excludedPoemIds: string[] = []): RankedPoem[] {
  const excluded = new Set(excludedPoemIds)

  return POEMS
    .map(poem => {
      let score = 0
      const reasons: string[] = []

      const moodHits = poem.moods.filter(mood => intent.moods.includes(mood))
      const themeHits = poem.themes.filter(theme => intent.themes.includes(theme))
      const toneHits = poem.tones.filter(tone => intent.tones.includes(tone))
      const keywordHits = poem.keywords.filter(keyword => intent.keywords.includes(keyword))

      if (moodHits.length > 0) {
        score += moodHits.length * 30
        reasons.push(`Mood fit: ${moodHits.join(', ')}`)
      }

      if (themeHits.length > 0) {
        score += themeHits.length * 22
        reasons.push(`Theme fit: ${themeHits.join(', ')}`)
      }

      if (toneHits.length > 0) {
        score += toneHits.length * 16
        reasons.push(`Tone fit: ${toneHits.join(', ')}`)
      }

      if (keywordHits.length > 0) {
        score += keywordHits.length * 8
      }

      if (intent.desiredLength && poem.length === intent.desiredLength) {
        score += 12
        reasons.push(`Length fit: ${poem.length}`)
      }

      if (intent.desiredIntensity && Math.abs(poem.intensity - intent.desiredIntensity) <= 1) {
        score += 10
      }

      if (excluded.has(poem.id)) {
        score -= 18
      }

      if (intent.tones.includes('gentle') && poem.tones.some(tone => SOFT_TONES.has(tone)) === false) {
        score -= 6
      }

      if (intent.moods.some(mood => HEAVY_MOODS.has(mood)) && poem.intensity <= 2) {
        score -= 6
      }

      return {
        poem,
        score,
        reasons: reasons.slice(0, 3),
      }
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
}
